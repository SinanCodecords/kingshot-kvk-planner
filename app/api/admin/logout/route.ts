import { json } from "@/lib/api";
import { endAdminSession } from "@/lib/auth";

export async function POST() {
  await endAdminSession();
  return json({ ok: true });
}
