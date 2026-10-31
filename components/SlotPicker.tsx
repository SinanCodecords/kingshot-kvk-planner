"use client";

import { localTime, timeZoneName } from "@/lib/format";
import { SLOT_COUNT, slotStart } from "@/lib/schedule";

const ALL = Array.from({ length: SLOT_COUNT }, (_, i) => i);

// The 48 half-hour buttons. Big number is game time (UTC), small number is the player's time.
export default function SlotPicker({ value, onChange }: { value: number[]; onChange: (slots: number[]) => void }) {
  const picked = new Set(value);
  const toggle = (i: number) => {
    const next = new Set(picked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange([...next].sort((a, b) => a - b));
  };

  return (
    <>
      <div className="slots-tools">
        <h3>Pick every time you can be online</h3>
        <span>
          {picked.size} picked ·{" "}
          <button className="linkbtn" type="button" onClick={() => onChange(ALL)}>Select all</button> ·{" "}
          <button className="linkbtn" type="button" onClick={() => onChange([])}>Clear</button>
        </span>
      </div>
      <p className="small muted" suppressHydrationWarning>
        Big number is game time (UTC). Small number is your time ({timeZoneName()}). Each turn is 30 minutes.
      </p>
      <div className="slots">
        {ALL.map((i) => (
          <button key={i} type="button" className="slot" aria-pressed={picked.has(i)} onClick={() => toggle(i)}>
            <b>{slotStart(i)}</b>
            <small suppressHydrationWarning>{localTime(i)}</small>
          </button>
        ))}
      </div>
    </>
  );
}
