"use client";

import { useState } from "react";
import { localTime } from "@/lib/format";
import { DAY_KEYS, DAYS, slotLabel, type DayKey } from "@/lib/schedule";

type Schedule = Record<DayKey, { slot: number; name: string; alliance: string }[]>;

export default function ScheduleView({ schedule }: { schedule: Schedule }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <>
      <label className="field">
        Find your name
        <input type="text" placeholder="Type your in-game name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {DAY_KEYS.map((day) => (
        <section className="card" key={day}>
          <div>
            <span className="day-badge">{DAYS[day].label}</span>
          </div>
          <h2>
            {DAYS[day].title} · {DAYS[day].position}
          </h2>
          {schedule[day].length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time (UTC)</th>
                    <th>Player</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule[day].map((a) => (
                    <tr key={a.slot} className={q && a.name.toLowerCase().includes(q) ? "me" : ""}>
                      <td className="time">
                        {slotLabel(a.slot)}
                        <div className="small muted" suppressHydrationWarning>{localTime(a.slot)}</div>
                      </td>
                      <td>
                        {a.name} {a.alliance && <span className="muted">[{a.alliance}]</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No turns set for this day.</p>
          )}
        </section>
      ))}
    </>
  );
}
