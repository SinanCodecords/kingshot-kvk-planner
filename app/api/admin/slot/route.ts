import { adminOnly, fail, isDay, isSlot, json, readBody } from "@/lib/api";
import { getPlayer, setLock, setSlot } from "@/lib/db";

// Body: { day, slot, locked } to lock/unlock, or { day, slot, gameId } to set (gameId null empties the turn).
export async function POST(req: Request) {
  return adminOnly(async () => {
    const { day, slot, gameId, locked } = await readBody(req);
    if (!isDay(day) || !isSlot(slot)) return fail(400, "Unknown day or turn.");
    if (typeof locked === "boolean" && gameId === undefined) {
      await setLock(day, slot, locked);
    } else {
      const id = gameId ? String(gameId) : null;
      if (id && !(await getPlayer(id))) return fail(404, "That player isn't signed up.");
      await setSlot(day, slot, id);
    }
    return json({ ok: true });
  });
}
