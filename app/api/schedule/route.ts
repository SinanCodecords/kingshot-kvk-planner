import { json } from "@/lib/api";
import { getSettings, publicSchedule } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSettings()).schedule_published) return json({ published: false });
  return json({ published: true, schedule: await publicSchedule() });
}
