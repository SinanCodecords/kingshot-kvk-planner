import { adminOnly, fail, isDay, json } from "@/lib/api";
import { allPlayers, assignments, replaceDay } from "@/lib/db";
import { assignDay } from "@/lib/schedule";

export async function POST(_req: Request, { params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return adminOnly(async () => {
    if (!isDay(day)) return fail(404, "Unknown day.");
    const locked = (await assignments(day)).filter((a) => a.locked);
    const result = assignDay(await allPlayers(), day, locked);
    await replaceDay(day, result.assignments);
    return json({ assigned: result.assignments.length, waitlist: result.waitlist.length });
  });
}
