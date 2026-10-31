"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PARTS = [
  { key: "d", label: "Days", size: 1440 },
  { key: "h", label: "Hours", size: 60 },
  { key: "m", label: "Minutes", size: 1 },
] as const;

// Speedups as days / hours / minutes boxes. The value is total minutes.
export function DurationInput({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}) {
  const parts = { d: Math.floor(value / 1440), h: Math.floor((value % 1440) / 60), m: value % 60 };

  const update = (key: keyof typeof parts, raw: string) => {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    const next = { ...parts, [key]: n };
    onChange(next.d * 1440 + next.h * 60 + next.m);
  };

  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {PARTS.map((p) => (
          <div key={p.key} className="flex flex-col gap-1">
            <Input
              id={`${id}-${p.key}`}
              type="number"
              inputMode="numeric"
              min={0}
              value={parts[p.key] || ""}
              placeholder="0"
              onChange={(e) => update(p.key, e.target.value)}
              className="h-10 font-mono"
            />
            <Label htmlFor={`${id}-${p.key}`} className="text-xs font-normal text-muted-foreground">
              {p.label}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
