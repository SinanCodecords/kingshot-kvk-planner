import { describe, expect, it } from "vitest";
import { assignDay, rankPlayers, slotLabel, SLOT_COUNT, type Player } from "@/lib/schedule";

let t = 0;
const player = (id: string, construction: number, slots: number[]): Player => ({
  game_id: id, name: id, alliance: "", d1_construction: construction, d1_research: 0, d1_general: 0,
  d4_training: 0, d4_general: 0, d1_slots: slots, d4_slots: [], created_at: ++t, updated_at: t,
});

describe("turns", () => {
  it("has 48 half-hour turns from 00:00 to 24:00", () => {
    expect(SLOT_COUNT).toBe(48);
    expect(slotLabel(0)).toBe("00:00-00:30");
    expect(slotLabel(47)).toBe("23:30-00:00");
  });
});

describe("assignDay", () => {
  it("gives the most speedups first pick and leaves busy times for others", () => {
    const players = [player("big", 900, [24, 25]), player("mid", 500, [24]), player("small", 100, [24])];
    const { assignments, waitlist } = assignDay(players, "d1", []);
    const at = Object.fromEntries(assignments.map((a) => [a.game_id, a.slot]));
    expect(at.big).toBe(25);
    expect(at.mid).toBe(24);
    expect(waitlist).toEqual(["small"]);
  });

  it("never moves a locked turn", () => {
    const players = [player("big", 900, [10]), player("vip", 1, [10])];
    const { assignments, waitlist } = assignDay(players, "d1", [{ slot: 10, game_id: "vip", locked: true }]);
    expect(assignments).toEqual([{ slot: 10, game_id: "vip", locked: true }]);
    expect(waitlist).toEqual(["big"]);
  });

  it("leaves out players with no speedups or no times", () => {
    expect(assignDay([player("none", 0, [1]), player("notime", 50, [])], "d1", []).assignments).toHaveLength(0);
  });

  it("breaks ties by earlier sign-up", () => {
    const ranked = rankPlayers([player("first", 100, [1]), player("second", 100, [1])], "d1");
    expect(ranked.map((r) => r.player.game_id)).toEqual(["first", "second"]);
  });
});
