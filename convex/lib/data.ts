import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { DayKey } from "./kvk";

// Upper bounds for reads. A kingdom never has anywhere near this many players.
export const MAX_PLAYERS = 2000;
const MAX_TURNS = 200;

export const DEFAULT_SETTINGS = {
  eventName: "KvK",
  submissionsOpen: true,
  schedulePublished: false,
};

export type Settings = typeof DEFAULT_SETTINGS;

export async function readSettings(ctx: QueryCtx): Promise<Settings> {
  const row = await ctx.db.query("settings").first();
  if (!row) return DEFAULT_SETTINGS;
  const { eventName, submissionsOpen, schedulePublished } = row;
  return { eventName, submissionsOpen, schedulePublished };
}

export async function settingsRow(ctx: MutationCtx): Promise<Doc<"settings">> {
  const row = await ctx.db.query("settings").first();
  if (row) return row;
  const id = await ctx.db.insert("settings", DEFAULT_SETTINGS);
  return (await ctx.db.get("settings", id))!;
}

export function requireAdmin(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new ConvexError("ADMIN_PASSWORD is not set in the Convex dashboard.");
  if (password !== expected) throw new ConvexError("Wrong admin password.");
}

export const isAdmin = (password: string) =>
  !!process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD;

export const listPlayers = (ctx: QueryCtx) => ctx.db.query("players").take(MAX_PLAYERS);

export const listAllTurns = (ctx: QueryCtx) => ctx.db.query("assignments").take(MAX_TURNS * 2);

export const listTurns = (ctx: QueryCtx, day: DayKey) =>
  ctx.db
    .query("assignments")
    .withIndex("by_day_and_slot", (q) => q.eq("day", day))
    .take(MAX_TURNS);

export const turnAt = (ctx: QueryCtx, day: DayKey, slot: number) =>
  ctx.db
    .query("assignments")
    .withIndex("by_day_and_slot", (q) => q.eq("day", day).eq("slot", slot))
    .first();
