// Display helpers used by the pages.

// Minutes -> "12d 4h" / "4h 30m"
export function fmtSpeed(min: number): string {
  min = Math.round(Number(min) || 0);
  if (!min) return "0";
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d && `${d.toLocaleString()}d`, h && `${h}h`, !d && m && `${m}m`].filter(Boolean).join(" ") || "0";
}

// Turn index -> start time in the viewer's time zone, e.g. "19:30".
export function localTime(slot: number): string {
  return new Date(Date.UTC(2026, 0, 1, 0, slot * 30)).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function timeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " ");
  } catch {
    return "your time";
  }
}

// Minutes <-> days / hours / minutes boxes
export const splitMinutes = (min: number) => ({
  d: Math.floor(min / 1440),
  h: Math.floor((min % 1440) / 60),
  m: min % 60,
});
