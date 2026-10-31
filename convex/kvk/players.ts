import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { readSettings } from "../lib/data";
import { isValidSlot } from "../lib/kvk";

// Game ID is the only "login". Not secure on purpose: anyone who knows an ID can edit that entry.
const cleanGameId = (raw: string) => {
  const id = raw.trim();
  if (!id || id.length > 32) throw new ConvexError("Enter a valid game ID.");
  return id;
};

const cleanMinutes = (n: number) => (Number.isFinite(n) ? Math.min(Math.max(Math.round(n), 0), 10_000_000) : 0);

const cleanSlots = (slots: number[]) => [...new Set(slots.filter(isValidSlot))].sort((a, b) => a - b);

export const get = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId.trim()))
      .unique();
    if (!player) return null;
    const { _id, ...entry } = player;
    return entry;
  },
});

export const save = mutation({
  args: {
    gameId: v.string(),
    name: v.string(),
    alliance: v.string(),
    d1Construction: v.number(),
    d1Research: v.number(),
    d1General: v.number(),
    d4Training: v.number(),
    d4General: v.number(),
    d1Slots: v.array(v.number()),
    d4Slots: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const settings = await readSettings(ctx);
    if (!settings.submissionsOpen) throw new ConvexError("Sign-ups are closed.");

    const gameId = cleanGameId(args.gameId);
    const name = args.name.trim();
    if (!name || name.length > 40) throw new ConvexError("Enter your in-game name (max 40 characters).");
    const alliance = args.alliance.trim();
    if (alliance.length > 10) throw new ConvexError("Alliance tag is too long.");

    const entry = {
      gameId,
      name,
      alliance,
      d1Construction: cleanMinutes(args.d1Construction),
      d1Research: cleanMinutes(args.d1Research),
      d1General: cleanMinutes(args.d1General),
      d4Training: cleanMinutes(args.d4Training),
      d4General: cleanMinutes(args.d4General),
      d1Slots: cleanSlots(args.d1Slots),
      d4Slots: cleanSlots(args.d4Slots),
    };

    const existing = await ctx.db
      .query("players")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .unique();
    if (existing) {
      await ctx.db.replace("players", existing._id, entry);
      return { created: false };
    }
    await ctx.db.insert("players", entry);
    return { created: true };
  },
});

// The player's own turns, only once the schedule is published.
export const myTurns = query({
  args: { gameId: v.string() },
  handler: async (ctx, { gameId }) => {
    const settings = await readSettings(ctx);
    if (!settings.schedulePublished) return null;
    const turns = await ctx.db
      .query("assignments")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId.trim()))
      .take(100);
    return turns.map(({ day, slot }) => ({ day, slot })).sort((a, b) => a.day.localeCompare(b.day) || a.slot - b.slot);
  },
});
