"use client";

import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLOTS, slotLocal, slotUtc, useToday } from "@/lib/kvk";
import { cn } from "@/lib/utils";

// UTC quarters of the day, 12 turns each.
const PERIODS = [
  { label: "00:00–06:00", icon: Moon, slots: SLOTS.slice(0, 12) },
  { label: "06:00–12:00", icon: Sunrise, slots: SLOTS.slice(12, 24) },
  { label: "12:00–18:00", icon: Sun, slots: SLOTS.slice(24, 36) },
  { label: "18:00–24:00", icon: Sunset, slots: SLOTS.slice(36, 48) },
];

// 48 toggle buttons, one per 30-minute turn. Shows UTC and the viewer's local time.
export function SlotGrid({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange: (slots: number[]) => void;
  disabled?: boolean;
}) {
  const today = useToday();
  const selected = new Set(value);

  const setSlots = (slots: number[], on: boolean) => {
    const next = new Set(selected);
    for (const s of slots) {
      if (on) next.add(s);
      else next.delete(s);
    }
    onChange([...next].sort((a, b) => a - b));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <span className="font-semibold text-primary">{value.length}</span>
          <span className="text-muted-foreground"> of {SLOTS.length} turns picked</span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...SLOTS])}>
            Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
      </div>
      {PERIODS.map((period) => {
        const allOn = period.slots.every((s) => selected.has(s));
        return (
          <div key={period.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <period.icon className="size-3.5" />
                {period.label} UTC
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setSlots(period.slots, !allOn)}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {allOn ? "Clear these" : "Pick all"}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {period.slots.map((slot) => {
                const on = selected.has(slot);
                const local = today && slotLocal(slot, today);
                return (
                  <Button
                    key={slot}
                    type="button"
                    variant={on ? "default" : "outline"}
                    aria-pressed={on}
                    disabled={disabled}
                    onClick={() => setSlots([slot], !on)}
                    className={cn("h-auto flex-col gap-0 rounded-lg py-2", on && "shadow-sm shadow-primary/30")}
                  >
                    <span className="font-mono text-sm font-semibold">{slotUtc(slot)}</span>
                    <span
                      className={cn("text-[11px] font-normal", on ? "text-primary-foreground/80" : "text-muted-foreground")}
                    >
                      {local ? `${local.time}${local.dayShift > 0 ? "⁺¹" : local.dayShift < 0 ? "⁻¹" : ""}` : " "}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
