// Ranking and turn assignment. Pure functions, shared by server and browser.
// A day has 48 turns of 30 minutes, 00:00-24:00 UTC. Turn i starts at i * 30 minutes.

export const SLOT_COUNT = 48;

export type DayKey = "d1" | "d4";

export interface Player {
  game_id: string;
  name: string;
  alliance: string;
  d1_construction: number; // minutes
  d1_research: number;
  d1_general: number;
  d4_training: number;
  d4_general: number;
  d1_slots: number[];
  d4_slots: number[];
  created_at: number; // ms since epoch
  updated_at: number;
}

export interface Assignment {
  slot: number;
  game_id: string;
  locked: boolean;
}

export interface DayInfo {
  key: DayKey;
  label: string;
  title: string;
  position: string;
  scoreHint: string;
}

export const DAYS: Record<DayKey, DayInfo> = {
  d1: {
    key: "d1",
    label: "Day 1",
    title: "Construction & Research",
    position: "Chief Minister",
    scoreHint: "Construction + research + general speedups for Day 1.",
  },
  d4: {
    key: "d4",
    label: "Day 4",
    title: "Training",
    position: "Noble Advisor",
    scoreHint: "Training + general speedups for Day 4.",
  },
};

export const DAY_KEYS: DayKey[] = ["d1", "d4"];

export function dayScore(p: Player, day: DayKey): number {
  return day === "d1" ? p.d1_construction + p.d1_research + p.d1_general : p.d4_training + p.d4_general;
}

export function slotsFor(p: Player, day: DayKey): number[] {
  return day === "d1" ? p.d1_slots : p.d4_slots;
}

const hhmm = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const slotStart = (i: number) => hhmm(i * 30);
export const slotLabel = (i: number) => `${hhmm(i * 30)}-${hhmm(i * 30 + 30)}`;

export interface Ranked {
  player: Player;
  score: number;
  slots: number[];
}

// Most speedups first; earlier sign-up wins ties.
export function rankPlayers(players: Player[], day: DayKey): Ranked[] {
  return players
    .map((p) => ({ player: p, score: dayScore(p, day), slots: slotsFor(p, day) }))
    .filter((r) => r.score > 0 && r.slots.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.player.created_at - b.player.created_at ||
        a.player.game_id.localeCompare(b.player.game_id),
    );
}

// Keeps locked turns. From the top of the ranking down, each player gets the free
// turn they picked that the fewest other players picked, so popular times stay open
// for people with no other choice. Players whose times are all taken are waitlisted.
export function assignDay(
  players: Player[],
  day: DayKey,
  locked: Assignment[],
): { assignments: Assignment[]; waitlist: string[] } {
  const ranked = rankPlayers(players, day);
  const taken = new Map<number, Assignment>();
  const assigned = new Set<string>();

  for (const a of locked) {
    if (a.slot < 0 || a.slot >= SLOT_COUNT || assigned.has(a.game_id)) continue;
    taken.set(a.slot, { slot: a.slot, game_id: a.game_id, locked: true });
    assigned.add(a.game_id);
  }

  const demand = new Array<number>(SLOT_COUNT).fill(0);
  for (const r of ranked) for (const s of r.slots) if (s >= 0 && s < SLOT_COUNT) demand[s]++;

  const waitlist: string[] = [];
  for (const r of ranked) {
    if (assigned.has(r.player.game_id)) continue;
    const open = r.slots.filter((s) => s >= 0 && s < SLOT_COUNT && !taken.has(s));
    if (open.length === 0) {
      waitlist.push(r.player.game_id);
      continue;
    }
    const best = open.reduce((a, b) => (demand[b] < demand[a] || (demand[b] === demand[a] && b < a) ? b : a));
    taken.set(best, { slot: best, game_id: r.player.game_id, locked: false });
    assigned.add(r.player.game_id);
  }

  return { assignments: [...taken.values()].sort((a, b) => a.slot - b.slot), waitlist };
}
