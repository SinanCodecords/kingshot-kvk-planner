"use client";

import { Button } from "@/components/ui/button";
import { SLOTS, slotLocal, slotUtc, useToday } from "@/lib/kvk";
import { cn } from "@/lib/utils";

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

  const toggle = (slot: number) => {
    const next = new Set(selected);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    onChange([...next].sort((a, b) => a - b));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {value.length} of {SLOTS.length} times picked
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...SLOTS])}>
            Select all
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8">
        {SLOTS.map((slot) => {
          const on = selected.has(slot);
          const local = today && slotLocal(slot, today);
          return (
            <Button
              key={slot}
              type="button"
              variant={on ? "default" : "outline"}
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(slot)}
              className="h-auto flex-col gap-0 py-1.5"
            >
              <span className="font-mono text-sm">{slotUtc(slot)}</span>
              <span className={cn("text-[11px] font-normal", on ? "text-primary-foreground/75" : "text-muted-foreground")}>
                {local ? `${local.time}${local.dayShift > 0 ? "⁺¹" : local.dayShift < 0 ? "⁻¹" : ""}` : " "}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
