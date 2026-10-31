import { useSyncExternalStore } from "react";
import { SLOT_COUNT, type DayKey } from "@convex/lib/kvk";

export { DAY_KEYS, SLOT_COUNT, dayScore, rankPlayers, type DayKey } from "@convex/lib/kvk";

export const SLOTS = Array.from({ length: SLOT_COUNT }, (_, i) => i);

export const DAYS: Record<DayKey, { label: string; title: string; position: string; scoreHint: string }> = {
  d1: {
    label: "Day 1",
    title: "Construction & Research",
    position: "Chief Minister",
    scoreHint: "Construction + research + general speedups",
  },
  d4: {
    label: "Day 4",
    title: "Training",
    position: "Noble Advisor",
    scoreHint: "Training + general speedups",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;

export const slotUtc = (slot: number) => hhmm(slot * 30);
export const slotRangeUtc = (slot: number) => `${hhmm(slot * 30)}–${hhmm(slot * 30 + 30)}`;

const timeFormat = () => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// Local start time of a turn, using today's date for the UTC offset.
// dayShift is -1/+1 when the turn falls on the previous/next day locally.
export function slotLocal(slot: number, today: Date) {
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, slot * 30),
  );
  const local = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  return { time: timeFormat().format(start), dayShift: Math.sign(local - utc) };
}

export const formatSlotLocal = (slot: number, today: Date) => {
  const { time, dayShift } = slotLocal(slot, today);
  return dayShift === 0 ? time : `${time} (${dayShift > 0 ? "+1" : "−1"} day)`;
};

const noopSubscribe = () => () => {};
let clientNow: Date | null = null;

// Current date on the client, null during server render and hydration.
// Local times depend on the viewer's time zone, so they only render in the browser.
export function useToday(): Date | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => (clientNow ??= new Date()),
    () => null,
  );
}

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatDuration(minutes: number) {
  if (minutes <= 0) return "0m";
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ");
}

export const playerLabel = (p: { name: string; alliance: string }) =>
  p.alliance ? `[${p.alliance}] ${p.name}` : p.name;
