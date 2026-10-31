import { cleanMinutes, cleanSlots, fail, json, readBody, validGameId } from "@/lib/api";
import { getSettings, savePlayer, type PlayerInput } from "@/lib/db";

const SPEED_KEYS = ["d1_construction", "d1_research", "d1_general", "d4_training", "d4_general"] as const;

export async function PUT(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!(await getSettings()).submissions_open) return fail(403, "Sign-ups are closed. Ask an admin to change your entry.");
  if (!validGameId(gameId)) return fail(400, "That game ID isn't valid.");

  const b = await readBody(req);
  const name = String(b.name ?? "").trim().slice(0, 30);
  if (!name) return fail(400, "Enter your in-game name.");

  const speed = {} as Record<(typeof SPEED_KEYS)[number], number>;
  for (const k of SPEED_KEYS) {
    const v = cleanMinutes(b[k]);
    if (v === null) return fail(400, "One of the speedup amounts isn't a valid number.");
    speed[k] = v;
  }
  const d1_slots = cleanSlots(b.d1_slots);
  const d4_slots = cleanSlots(b.d4_slots);
  if (!d1_slots || !d4_slots) return fail(400, "The selected times aren't valid. Reload and try again.");
  if (!d1_slots.length && !d4_slots.length) return fail(400, "Pick at least one time on Day 1 or Day 4.");

  const input: PlayerInput = {
    game_id: gameId,
    name,
    alliance: String(b.alliance ?? "").trim().slice(0, 8),
    ...speed,
    d1_slots,
    d4_slots,
  };
  return json({ player: await savePlayer(input) });
}
