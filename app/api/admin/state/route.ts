import { adminOnly, json } from "@/lib/api";
import { allPlayers, assignments, getSettings } from "@/lib/db";
import { DAY_KEYS, rankPlayers, type Assignment, type DayKey } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  return adminOnly(async () => {
    const players = await allPlayers();
    const days = {} as Record<DayKey, { assignments: Assignment[]; ranking: { game_id: string; score: number; assigned: boolean }[] }>;
    for (const day of DAY_KEYS) {
      const list = await assignments(day);
      const ids = new Set(list.map((a) => a.game_id));
      days[day] = {
        assignments: list,
        ranking: rankPlayers(players, day).map((r) => ({ game_id: r.player.game_id, score: r.score, assigned: ids.has(r.player.game_id) })),
      };
    }
    return json({ settings: await getSettings(), players, days });
  });
}
