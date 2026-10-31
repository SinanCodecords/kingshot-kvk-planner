import { fail, json, readBody } from "@/lib/api";
import { checkPassword, startAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await readBody(req);
  if (!checkPassword(String(password ?? ""))) return fail(401, "Wrong password.");
  await startAdminSession();
  return json({ ok: true });
}
