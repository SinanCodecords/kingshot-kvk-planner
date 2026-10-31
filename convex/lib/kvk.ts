// Pure KvK scheduling logic, shared by Convex functions and the browser.
// A day has 48 turns of 30 minutes, 00:00–24:00 UTC. Turn i starts at i * 30 minutes.

export const SLOT_COUNT = 48;

export type DayKey = "d1" | "d4";

export const DAY_KEYS: DayKey[] = ["d1", "d4"];

export interface PlayerSpeedups {
  gameId: string;
  d1Construction: number;
  d1Research: number;
  d1General: number;
  d4Training: number;
  d4General: number;
  d1Slots: number[];
  d4Slots: number[];
  _creationTime: number;
}

export interface Turn {
  slot: number;
  gameId: string;
  locked: boolean;
}

export function dayScore(p: PlayerSpeedups, day: DayKey): number {
  return day === "d1" ? p.d1Construction + p.d1Research + p.d1General : p.d4Training + p.d4General;
}

export function slotsFor(p: PlayerSpeedups, day: DayKey): number[] {
  return day === "d1" ? p.d1Slots : p.d4Slots;
}

export const isValidSlot = (s: number) => Number.isInteger(s) && s >= 0 && s < SLOT_COUNT;

// Most speedups first; earlier sign-up wins ties. Players with no speedups or no picked times are left out.
export function rankPlayers<P extends PlayerSpeedups>(players: P[], day: DayKey) {
  return players
    .map((player) => ({ player, score: dayScore(player, day), slots: slotsFor(player, day) }))
    .filter((r) => r.score > 0 && r.slots.length > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.player._creationTime - b.player._creationTime ||
        a.player.gameId.localeCompare(b.player.gameId),
    );
}

// Keeps locked turns. From the top of the ranking down, each player gets the free
// turn they picked that the fewest other players picked, so popular times stay open
// for people with no other choice. Players whose times are all taken are waitlisted.
export function assignDay(
  players: PlayerSpeedups[],
  day: DayKey,
  locked: Turn[],
): { turns: Turn[]; waitlist: string[] } {
  const ranked = rankPlayers(players, day);
  const taken = new Map<number, Turn>();
  const assigned = new Set<string>();

  for (const t of locked) {
    if (!isValidSlot(t.slot) || taken.has(t.slot)) continue;
    taken.set(t.slot, { ...t, locked: true });
    assigned.add(t.gameId);
  }

  const demand = new Array<number>(SLOT_COUNT).fill(0);
  for (const r of ranked) for (const s of r.slots) if (isValidSlot(s)) demand[s]++;

  const waitlist: string[] = [];
  for (const r of ranked) {
    if (assigned.has(r.player.gameId)) continue;
    const open = r.slots.filter((s) => isValidSlot(s) && !taken.has(s));
    if (open.length === 0) {
      waitlist.push(r.player.gameId);
      continue;
    }
    const best = open.reduce((a, b) => (demand[b] < demand[a] || (demand[b] === demand[a] && b < a) ? b : a));
    taken.set(best, { slot: best, gameId: r.player.gameId, locked: false });
    assigned.add(r.player.gameId);
  }

  return { turns: [...taken.values()].sort((a, b) => a.slot - b.slot), waitlist };
}
