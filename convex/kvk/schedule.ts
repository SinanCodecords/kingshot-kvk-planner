import { query } from "../_generated/server";
import { listAllTurns, readSettings } from "../lib/data";

export const settings = query({
  args: {},
  handler: async (ctx) => readSettings(ctx),
});

// Public, read-only schedule. Returns null until the admin publishes it. Speedups are not exposed.
export const published = query({
  args: {},
  handler: async (ctx) => {
    const settings = await readSettings(ctx);
    if (!settings.schedulePublished) return null;

    const turns = await listAllTurns(ctx);
    const rows = await Promise.all(
      turns.map(async (t) => {
        const player = await ctx.db
          .query("players")
          .withIndex("by_gameId", (q) => q.eq("gameId", t.gameId))
          .unique();
        return { day: t.day, slot: t.slot, name: player?.name ?? "Unknown", alliance: player?.alliance ?? "" };
      }),
    );
    return { eventName: settings.eventName, turns: rows };
  },
});
