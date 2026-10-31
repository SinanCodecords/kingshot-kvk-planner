import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";
import { DAYS, SLOT_COUNT, type DayKey } from "./schedule";

// Small helpers shared by the route handlers.

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

// Runs an admin-only handler; answers 401 when the admin cookie is missing.
export async function adminOnly(handler: () => Promise<Response>): Promise<Response> {
  if (!(await isAdmin())) return fail(401, "Log in as admin first.");
  return handler();
}

export const isDay = (v: unknown): v is DayKey => typeof v === "string" && v in DAYS;
export const isSlot = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < SLOT_COUNT;
export const validGameId = (v: unknown): v is string => typeof v === "string" && /^\d{3,20}$/.test(v);

const MAX_MINUTES = 100 * 365 * 1440;

export function cleanMinutes(v: unknown): number | null {
  const n = Math.round(Number(v ?? 0));
  return Number.isFinite(n) && n >= 0 && n <= MAX_MINUTES ? n : null;
}

export function cleanSlots(v: unknown): number[] | null {
  if (v == null) return [];
  if (!Array.isArray(v) || !v.every(isSlot)) return null;
  return [...new Set(v as number[])].sort((a, b) => a - b);
}
