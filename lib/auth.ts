import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// Admin login: one shared password from ADMIN_PASSWORD, kept as a signed cookie for 7 days.

const COOKIE = "kvk_admin";
const MAX_AGE = 7 * 24 * 3600;

function secret(): string {
  const s = process.env.SECRET_KEY;
  if (!s) throw new Error("SECRET_KEY is not set.");
  return s;
}

const sign = (value: string) => crypto.createHmac("sha256", secret()).update(value).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function checkPassword(given: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(given, expected);
}

export async function startAdminSession(): Promise<void> {
  const expires = String(Date.now() + MAX_AGE * 1000);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(expires));
}
