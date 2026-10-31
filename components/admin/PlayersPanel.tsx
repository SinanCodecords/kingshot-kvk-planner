"use client";

import { useState } from "react";
import { useToast } from "../Toast";
import type { Act, AdminState } from "./types";
import { api, copyText } from "@/lib/client";
import { fmtSpeed } from "@/lib/format";
import { slotStart } from "@/lib/schedule";

export default function PlayersPanel({ state, act }: { state: AdminState; act: Act }) {
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resetText, setResetText] = useState("");
  const players = [...state.players].sort((a, b) => a.name.localeCompare(b.name));

  const exportCsv = async () => {
    const q = (v: unknown) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const rows = [
      "game_id,name,alliance,d1_construction_min,d1_research_min,d1_general_min,d4_training_min,d4_general_min,d1_times,d4_times",
      ...state.players.map((p) =>
        [p.game_id, p.name, p.alliance, p.d1_construction, p.d1_research, p.d1_general, p.d4_training, p.d4_general,
          p.d1_slots.map(slotStart).join(" "), p.d4_slots.map(slotStart).join(" ")].map(q).join(","),
      ),
    ];
    if (await copyText(rows.join("\n"))) toast("CSV copied");
  };

  const reset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetText !== "RESET") return toast("Type RESET to confirm");
    act(() => api("/api/admin/reset", { method: "POST", body: { confirm: "RESET" } }), "Everything deleted");
    setResetText("");
  };

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h2>All players</h2>
          <button className="btn secondary" onClick={exportCsv}>Copy as CSV</button>
        </div>
        {players.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th><th>Alliance</th><th className="num">D1 Constr.</th><th className="num">D1 Research</th>
                  <th className="num">D1 General</th><th className="num">D4 Training</th><th className="num">D4 General</th>
                  <th className="num">Times D1/D4</th><th>Updated</th><th></th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.game_id}>
                    <td>{p.name}<div className="small muted">ID {p.game_id}</div></td>
                    <td>{p.alliance}</td>
                    <td className="num">{fmtSpeed(p.d1_construction)}</td>
                    <td className="num">{fmtSpeed(p.d1_research)}</td>
                    <td className="num">{fmtSpeed(p.d1_general)}</td>
                    <td className="num">{fmtSpeed(p.d4_training)}</td>
                    <td className="num">{fmtSpeed(p.d4_general)}</td>
                    <td className="num">{p.d1_slots.length} / {p.d4_slots.length}</td>
                    <td className="small muted">{new Date(p.updated_at).toLocaleString()}</td>
                    <td>
                      {confirmDelete === p.game_id ? (
                        <div className="row">
                          <button className="btn small danger" onClick={() => { setConfirmDelete(null); act(() => api(`/api/admin/players/${p.game_id}`, { method: "DELETE" }), "Player deleted"); }}>Delete</button>
                          <button className="btn small plain" onClick={() => setConfirmDelete(null)}>Keep</button>
                        </div>
                      ) : (
                        <button className="btn small plain" onClick={() => setConfirmDelete(p.game_id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No sign-ups yet.</p>
        )}
      </section>

      <section className="card">
        <h2>Start a new KvK</h2>
        <p className="muted">Deletes every player and every turn. Settings stay. Type RESET to confirm.</p>
        <form className="row" onSubmit={reset}>
          <input type="text" placeholder="RESET" style={{ maxWidth: 200 }} autoComplete="off" value={resetText} onChange={(e) => setResetText(e.target.value)} />
          <button className="btn danger" type="submit">Delete everything</button>
        </form>
      </section>
    </>
  );
}
