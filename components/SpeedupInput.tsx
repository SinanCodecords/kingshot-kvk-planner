"use client";

import { useState } from "react";
import { splitMinutes } from "@/lib/format";

// Days / hours / minutes boxes, the way the game shows speedups. Value is in minutes.
export default function SpeedupInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (minutes: number) => void;
}) {
  const start = splitMinutes(value);
  const [parts, setParts] = useState({
    d: start.d ? String(start.d) : "",
    h: start.h ? String(start.h) : "",
    m: start.m ? String(start.m) : "",
  });

  const update = (key: "d" | "h" | "m", raw: string) => {
    const next = { ...parts, [key]: raw.replace(/\D/g, "") };
    setParts(next);
    const n = (s: string) => Number(s) || 0;
    onChange(n(next.d) * 1440 + n(next.h) * 60 + n(next.m));
  };

  const box = (key: "d" | "h" | "m", unit: string, name: string) => (
    <label>
      <input
        type="text"
        inputMode="numeric"
        id={`${id}-${key}`}
        aria-label={`${label} ${name}`}
        placeholder="0"
        value={parts[key]}
        onChange={(e) => update(key, e.target.value)}
      />
      <i>{unit}</i>
    </label>
  );

  return (
    <div className="speed">
      <span>{label}</span>
      <div className="dhm">
        {box("d", "d", "days")}
        {box("h", "h", "hours")}
        {box("m", "m", "minutes")}
      </div>
    </div>
  );
}
