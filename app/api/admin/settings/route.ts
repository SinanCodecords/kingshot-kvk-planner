import { adminOnly, json, readBody } from "@/lib/api";
import { getSettings, setSetting } from "@/lib/db";

export async function POST(req: Request) {
  return adminOnly(async () => {
    const b = await readBody(req);
    if (typeof b.event_name === "string") await setSetting("event_name", b.event_name.trim().slice(0, 60) || "KvK Appointments");
    if (typeof b.submissions_open === "boolean") await setSetting("submissions_open", b.submissions_open);
    if (typeof b.schedule_published === "boolean") await setSetting("schedule_published", b.schedule_published);
    return json({ settings: await getSettings() });
  });
}
