import "server-only";
import postgres from "postgres";
import { DAY_KEYS, type Assignment, type DayKey, type Player } from "./schedule";

// One connection pool per server process (kept across hot reloads in dev).
const globalForDb = globalThis as unknown as { sql?: postgres.Sql; schemaReady?: Promise<void> };

function getSql(): postgres.Sql {
  if (!globalForDb.sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    globalForDb.sql = postgres(url, { max: 5, idle_timeout: 20 });
  }
  return globalForDb.sql;
}

// Tables are created on first use, so a fresh database needs no setup step.
async function db(): Promise<postgres.Sql> {
  const sql = getSql();
  globalForDb.schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        game_id         TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        alliance        TEXT NOT NULL DEFAULT '',
        d1_construction INTEGER NOT NULL DEFAULT 0,
        d1_research     INTEGER NOT NULL DEFAULT 0,
        d1_general      INTEGER NOT NULL DEFAULT 0,
        d4_training     INTEGER NOT NULL DEFAULT 0,
        d4_general      INTEGER NOT NULL DEFAULT 0,
        d1_slots        INTEGER[] NOT NULL DEFAULT '{}',
        d4_slots        INTEGER[] NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS assignments (
        day     TEXT NOT NULL,
        slot    INTEGER NOT NULL,
        game_id TEXT NOT NULL REFERENCES players(game_id) ON DELETE CASCADE,
        locked  BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY (day, slot)
      )`;
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value JSONB NOT NULL
      )`;
  })().catch((e) => {
    globalForDb.schemaReady = undefined;
    throw e;
  });
  await globalForDb.schemaReady;
  return sql;
}

/* ---------- players ---------- */

type PlayerRow = Omit<Player, "created_at" | "updated_at"> & { created_at: Date; updated_at: Date };

const toPlayer = (r: PlayerRow): Player => ({
  ...r,
  created_at: r.created_at.getTime(),
  updated_at: r.updated_at.getTime(),
});

export async function getPlayer(gameId: string): Promise<Player | null> {
  const sql = await db();
  const rows = await sql<PlayerRow[]>`SELECT * FROM players WHERE game_id = ${gameId}`;
  return rows[0] ? toPlayer(rows[0]) : null;
}

export async function allPlayers(): Promise<Player[]> {
  const sql = await db();
  const rows = await sql<PlayerRow[]>`SELECT * FROM players ORDER BY created_at`;
  return rows.map(toPlayer);
}

export type PlayerInput = Omit<Player, "created_at" | "updated_at">;

export async function savePlayer(p: PlayerInput): Promise<Player> {
  const sql = await db();
  const rows = await sql<PlayerRow[]>`
    INSERT INTO players (game_id, name, alliance, d1_construction, d1_research, d1_general,
                         d4_training, d4_general, d1_slots, d4_slots)
    VALUES (${p.game_id}, ${p.name}, ${p.alliance}, ${p.d1_construction}, ${p.d1_research},
            ${p.d1_general}, ${p.d4_training}, ${p.d4_general}, ${p.d1_slots}, ${p.d4_slots})
    ON CONFLICT (game_id) DO UPDATE SET
      name = EXCLUDED.name, alliance = EXCLUDED.alliance,
      d1_construction = EXCLUDED.d1_construction, d1_research = EXCLUDED.d1_research,
      d1_general = EXCLUDED.d1_general, d4_training = EXCLUDED.d4_training,
      d4_general = EXCLUDED.d4_general, d1_slots = EXCLUDED.d1_slots,
      d4_slots = EXCLUDED.d4_slots, updated_at = now()
    RETURNING *`;
  return toPlayer(rows[0]);
}

export async function deletePlayer(gameId: string): Promise<void> {
  const sql = await db();
  await sql`DELETE FROM players WHERE game_id = ${gameId}`; // assignments go with it (ON DELETE CASCADE)
}

/* ---------- assignments ---------- */

export async function assignments(day: DayKey): Promise<Assignment[]> {
  const sql = await db();
  return sql<Assignment[]>`SELECT slot, game_id, locked FROM assignments WHERE day = ${day} ORDER BY slot`;
}

export async function replaceDay(day: DayKey, list: Assignment[]): Promise<void> {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM assignments WHERE day = ${day}`;
    for (const a of list) {
      await tx`INSERT INTO assignments (day, slot, game_id, locked) VALUES (${day}, ${a.slot}, ${a.game_id}, ${a.locked})`;
    }
  });
}

// Put a player in a turn by hand (always locked), or empty the turn when gameId is null.
export async function setSlot(day: DayKey, slot: number, gameId: string | null): Promise<void> {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM assignments WHERE day = ${day} AND slot = ${slot}`;
    if (gameId) {
      await tx`DELETE FROM assignments WHERE day = ${day} AND game_id = ${gameId}`;
      await tx`INSERT INTO assignments (day, slot, game_id, locked) VALUES (${day}, ${slot}, ${gameId}, true)`;
    }
  });
}

export async function setLock(day: DayKey, slot: number, locked: boolean): Promise<void> {
  const sql = await db();
  await sql`UPDATE assignments SET locked = ${locked} WHERE day = ${day} AND slot = ${slot}`;
}

export async function resetEvent(): Promise<void> {
  const sql = await db();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM assignments`;
    await tx`DELETE FROM players`;
  });
}

/* ---------- settings ---------- */

export interface Settings {
  event_name: string;
  submissions_open: boolean;
  schedule_published: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  event_name: "KvK Appointments",
  submissions_open: true,
  schedule_published: false,
};

export async function getSettings(): Promise<Settings> {
  const sql = await db();
  const rows = await sql<{ key: string; value: unknown }[]>`SELECT key, value FROM settings`;
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) if (key in s) (s as unknown as Record<string, unknown>)[key] = value;
  return s;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const sql = await db();
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${sql.json(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
}

/* ---------- combined reads ---------- */

// Published schedule as names, for the public page.
export async function publicSchedule() {
  const players = new Map((await allPlayers()).map((p) => [p.game_id, p]));
  const out = {} as Record<DayKey, { slot: number; name: string; alliance: string }[]>;
  for (const day of DAY_KEYS) {
    out[day] = (await assignments(day)).map((a) => ({
      slot: a.slot,
      name: players.get(a.game_id)?.name ?? "Unknown",
      alliance: players.get(a.game_id)?.alliance ?? "",
    }));
  }
  return out;
}

// A player's own turns, only once the schedule is published.
export async function playerTurns(gameId: string): Promise<Record<DayKey, number | null> | null> {
  if (!(await getSettings()).schedule_published) return null;
  const out = {} as Record<DayKey, number | null>;
  for (const day of DAY_KEYS) out[day] = (await assignments(day)).find((a) => a.game_id === gameId)?.slot ?? null;
  return out;
}
