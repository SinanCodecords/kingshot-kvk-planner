import type { Metadata } from "next";
import { KvkAdmin } from "@/components/tools/kvk/admin";

export const metadata: Metadata = { title: "KvK admin", robots: { index: false } };

export default function KvkAdminPage() {
  return <KvkAdmin />;
}
