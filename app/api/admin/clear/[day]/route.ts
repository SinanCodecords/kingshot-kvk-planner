import { adminOnly, fail, isDay, json } from "@/lib/api";
import { replaceDay } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  return adminOnly(async () => {
    if (!isDay(day)) return fail(404, "Unknown day.");
    await replaceDay(day, []);
    return json({ ok: true });
  });
}
