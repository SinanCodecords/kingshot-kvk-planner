import type { Metadata } from "next";
import { PublicSchedule } from "@/components/tools/kvk/public-schedule";

export const metadata: Metadata = { title: "KvK schedule" };

export default function KvkSchedulePage() {
  return <PublicSchedule />;
}
