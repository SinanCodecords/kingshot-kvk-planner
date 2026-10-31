import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const dayValidator = v.union(v.literal("d1"), v.literal("d4"));

export default defineSchema({
  // KvK Appointment Planner. Speedups are stored in minutes, slots are 0–47 (30-minute turns from 00:00 UTC).
  players: defineTable({
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
  }).index("by_gameId", ["gameId"]),

  assignments: defineTable({
    day: dayValidator,
    slot: v.number(),
    gameId: v.string(),
    locked: v.boolean(),
  })
    .index("by_day_and_slot", ["day", "slot"])
    .index("by_gameId", ["gameId"]),

  // Single row.
  settings: defineTable({
    eventName: v.string(),
    submissionsOpen: v.boolean(),
    schedulePublished: v.boolean(),
  }),
});
