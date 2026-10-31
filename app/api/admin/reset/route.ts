import { adminOnly, fail, json, readBody } from "@/lib/api";
import { resetEvent } from "@/lib/db";

export async function POST(req: Request) {
  return adminOnly(async () => {
    if ((await readBody(req)).confirm !== "RESET") return fail(400, "Type RESET to confirm.");
    await resetEvent();
    return json({ ok: true });
  });
}
