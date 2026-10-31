"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "../Toast";
import DayPanel from "./DayPanel";
import PlayersPanel from "./PlayersPanel";
import type { Act, AdminState } from "./types";
import { api, ApiError, copyText } from "@/lib/client";
import { DAY_KEYS, DAYS, type DayKey } from "@/lib/schedule";

type Tab = DayKey | "players";

export default function AdminDashboard() {
  const toast = useToast();
  const [state, setState] = useState<AdminState | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("d1");
  const [eventName, setEventName] = useState("");
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await api<AdminState>("/api/admin/state");
      setState(s);
      setEventName(s.settings.event_name);
      setNeedLogin(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setNeedLogin(true);
      else toast((err as Error).message);
    }
  }, [toast]);

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, [load]);

  const act: Act = async (call, message) => {
    try {
      await call();
      if (message) toast(message);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return setNeedLogin(true);
      toast((err as Error).message);
    }
    await load();
  };

  const saveSetting = (body: Record<string, unknown>, message: string) =>
    act(() => api("/api/admin/settings", { method: "POST", body }), message);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      await api("/api/admin/login", { method: "POST", body: { password } });
      setPassword("");
      await load();
    } catch (err) {
      setLoginError((err as Error).message);
    }
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setState(null);
    setNeedLogin(true);
  }

  if (needLogin) {
    return (
      <main>
        <section className="card" style={{ maxWidth: 420 }}>
          <h1>Admin login</h1>
          <form className="row" onSubmit={login}>
            <label className="field" style={{ flex: 1 }}>
              Password
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>Log in</button>
          </form>
          {loginError && <p className="error" role="alert">{loginError}</p>}
        </section>
      </main>
    );
  }

  if (!state) return <main><p className="muted">Loading…</p></main>;

  const s = state.settings;
  const links = { players: `${origin}/`, schedule: `${origin}/schedule` };

  return (
    <main>
      <section className="card">
        <div className="card-head">
          <label className="field" style={{ flex: "1 1 260px" }}>
            Event name
            <input
              type="text"
              maxLength={60}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              onBlur={() => eventName !== s.event_name && saveSetting({ event_name: eventName }, "Name saved")}
            />
          </label>
          <div className="row" style={{ gap: 20 }}>
            <label className="switch">
              <input type="checkbox" checked={s.submissions_open}
                onChange={(e) => saveSetting({ submissions_open: e.target.checked }, e.target.checked ? "Sign-ups opened" : "Sign-ups closed")} />
              Sign-ups open
            </label>
            <label className="switch">
              <input type="checkbox" checked={s.schedule_published}
                onChange={(e) => saveSetting({ schedule_published: e.target.checked }, e.target.checked ? "Schedule published" : "Schedule hidden")} />
              Schedule published
            </label>
            <button className="btn plain small" onClick={logout}>Log out</button>
          </div>
        </div>
        <div className="grid2">
          {([["Link for players", links.players], ["Link to the schedule", links.schedule]] as const).map(([label, url]) => (
            <div className="field" key={label}>
              {label}
              <div className="copyline">
                <code>{url}</code>
                <button className="btn small secondary" onClick={async () => (await copyText(url)) && toast("Link copied")}>Copy</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="stats">
        {[
          [state.players.length, "Players signed up"],
          [`${state.days.d1.assignments.length}/48`, "Day 1 turns filled"],
          [`${state.days.d4.assignments.length}/48`, "Day 4 turns filled"],
          [s.schedule_published ? "Published" : "Not published", "Schedule"],
        ].map(([v, l]) => (
          <div className="stat" key={String(l)}>
            <div className="v">{v}</div>
            <div className="l">{l}</div>
          </div>
        ))}
      </div>

      <div className="tabs" role="tablist">
        {DAY_KEYS.map((d) => (
          <button key={d} className="tab" role="tab" aria-selected={tab === d} onClick={() => setTab(d)}>
            {DAYS[d].label} · {DAYS[d].title}
          </button>
        ))}
        <button className="tab" role="tab" aria-selected={tab === "players"} onClick={() => setTab("players")}>
          All players
        </button>
      </div>

      {tab === "players" ? (
        <PlayersPanel state={state} act={act} />
      ) : (
        <DayPanel key={tab} day={tab} state={state} act={act} />
      )}
    </main>
  );
}
