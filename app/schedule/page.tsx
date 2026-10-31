import Link from "next/link";
import ScheduleView from "@/components/ScheduleView";
import { getSettings, publicSchedule } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule · KvK Appointments" };

export default async function SchedulePage() {
  const settings = await getSettings();
  return (
    <main className="narrow">
      <div>
        <h1>{settings.event_name} schedule</h1>
        <p className="muted">Times are game time (UTC). The small time is yours. Be online and ready when your turn starts.</p>
      </div>
      {settings.schedule_published ? (
        <ScheduleView schedule={await publicSchedule()} />
      ) : (
        <div className="notice info">
          The schedule isn&apos;t out yet. Check back later, or <Link href="/">sign up now</Link>.
        </div>
      )}
    </main>
  );
}
