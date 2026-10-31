"use client";

import { useToast } from "../Toast";
import type { Act, AdminState } from "./types";
import { api, copyText } from "@/lib/client";
import { fmtSpeed, localTime, timeZoneName } from "@/lib/format";
import { DAYS, SLOT_COUNT, dayScore, slotLabel, slotsFor, type DayKey } from "@/lib/schedule";

export default function DayPanel({ day, state, act }: { day: DayKey; state: AdminState; act: Act }) {
  const toast = useToast();
  const info = DAYS[day];
  const byId = new Map(state.players.map((p) => [p.game_id, p]));
  const { assignments, ranking } = state.days[day];
  const bySlot = new Map(assignments.map((a) => [a.slot, a]));
  const waiting = ranking.filter((r) => !r.assigned).length;

  const autoAssign = () =>
    act(async () => {
      const r = await api<{ assigned: number; waitlist: number }>(`/api/admin/auto-assign/${day}`, { method: "POST" });
      toast(`${r.assigned} turns filled, ${r.waitlist} waiting`);
    });

  const copySchedule = async () => {
    const lines = [`${state.settings.event_name} · ${info.label} ${info.title} (UTC)`];
    for (const a of assignments) {
      const p = byId.get(a.game_id);
      if (p) lines.push(`${slotLabel(a.slot)}  ${p.name}${p.alliance ? ` [${p.alliance}]` : ""}`);
    }
    if (await copyText(lines.join("\n"))) toast("Schedule copied");
  };

  const setSlot = (slot: number, gameId: string) =>
    act(() => api("/api/admin/slot", { method: "POST", body: { day, slot, gameId: gameId || null } }), gameId ? "Turn set and locked" : "Turn emptied");

  const toggleLock = (slot: number, locked: boolean) =>
    act(() => api("/api/admin/slot", { method: "POST", body: { day, slot, locked } }));

  return (
    <div className="cols">
      <section className="card">
        <div className="card-head">
          <h2>{info.label} · {info.position}</h2>
          <div className="row">
            <button className="btn" onClick={autoAssign}>Auto-assign</button>
            <button className="btn secondary" onClick={copySchedule}>Copy for chat</button>
            <button className="btn plain" onClick={() => act(() => api(`/api/admin/clear/${day}`, { method: "POST" }), "Day cleared")}>Clear day</button>
          </div>
        </div>
        <p className="small muted" suppressHydrationWarning>
          Auto-assign fills turns by speedups, most first. It keeps locked turns and moves everyone else. Pick a player in
          the last column to set a turn by hand; that turn gets locked. Small time is {timeZoneName()}.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time (UTC)</th><th>Player</th><th className="num">Speedups</th><th></th><th>Change</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: SLOT_COUNT }, (_, i) => {
                const a = bySlot.get(i);
                const p = a && byId.get(a.game_id);
                // players who picked this time come first, then those without a turn, then by speedups
                const options = ranking
                  .map((r) => ({ r, p: byId.get(r.game_id)!, picked: slotsFor(byId.get(r.game_id)!, day).includes(i) }))
                  .sort((x, y) => Number(y.picked) - Number(x.picked) || Number(x.r.assigned) - Number(y.r.assigned) || y.r.score - x.r.score);
                return (
                  <tr key={i} className={a ? "" : "empty-row"}>
                    <td className="time">{slotLabel(i)}<div className="small muted" suppressHydrationWarning>{localTime(i)}</div></td>
                    <td className="who">{p ? <>{p.name} {p.alliance && <span className="muted">[{p.alliance}]</span>}</> : "Open"}</td>
                    <td className="num">{p ? fmtSpeed(dayScore(p, day)) : ""}</td>
                    <td>
                      {a && (
                        <button className={`btn small ${a.locked ? "secondary" : "plain"}`} onClick={() => toggleLock(i, !a.locked)}>
                          {a.locked ? "🔒 Locked" : "Lock"}
                        </button>
                      )}
                    </td>
                    <td>
                      <select aria-label={`Change player for ${slotLabel(i)}`} value={a?.game_id ?? ""} onChange={(e) => setSlot(i, e.target.value)}>
                        <option value="">{a ? "Remove player" : "Choose player…"}</option>
                        {options.map(({ r, p: op, picked }) => (
                          <option key={r.game_id} value={r.game_id}>
                            {op.name}
                            {picked ? "" : " (didn't pick this time)"}
                            {r.assigned && a?.game_id !== r.game_id ? " · has a turn" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Ranking</h2><span className="small muted">{waiting} waiting</span></div>
        <p className="small muted">{info.scoreHint}</p>
        {ranking.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th className="num">#</th><th>Player</th><th className="num">Speedups</th><th className="num">Times picked</th><th></th></tr></thead>
              <tbody>
                {ranking.map((r, n) => {
                  const p = byId.get(r.game_id)!;
                  return (
                    <tr key={r.game_id}>
                      <td className="num">{n + 1}</td>
                      <td>{p.name} {p.alliance && <span className="muted">[{p.alliance}]</span>}</td>
                      <td className="num">{fmtSpeed(r.score)}</td>
                      <td className="num">{slotsFor(p, day).length}</td>
                      <td>{r.assigned ? <span className="tag ok">Has turn</span> : <span className="tag warn">Waiting</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nobody has signed up for this day yet. Share the player link.</p>
        )}
      </section>
    </div>
  );
}
