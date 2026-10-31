import { json } from "@/lib/api";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return json({ eventName: s.event_name, submissionsOpen: s.submissions_open, schedulePublished: s.schedule_published });
}
