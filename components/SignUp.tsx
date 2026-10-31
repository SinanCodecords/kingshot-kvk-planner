"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SlotPicker from "./SlotPicker";
import SpeedupInput from "./SpeedupInput";
import { useToast } from "./Toast";
import { api } from "@/lib/client";
import { localTime } from "@/lib/format";
import { DAY_KEYS, DAYS, slotLabel, type DayKey, type Player } from "@/lib/schedule";

type Turns = Record<DayKey, number | null> | null;
type Form = Omit<Player, "game_id" | "created_at" | "updated_at">;

const EMPTY: Form = {
  name: "",
  alliance: "",
  d1_construction: 0,
  d1_research: 0,
  d1_general: 0,
  d4_training: 0,
  d4_general: 0,
  d1_slots: [],
  d4_slots: [],
};

const SPEED_FIELDS: Record<DayKey, [keyof Form, string][]> = {
  d1: [
    ["d1_construction", "Construction speedups"],
    ["d1_research", "Research speedups"],
    ["d1_general", "General speedups (for Day 1)"],
  ],
  d4: [
    ["d4_training", "Training speedups"],
    ["d4_general", "General speedups (for Day 4)"],
  ],
};

const ID_KEY = "kvk-game-id";

export default function SignUp() {
  const toast = useToast();
  const [config, setConfig] = useState<{ eventName: string; submissionsOpen: boolean } | null>(null);
  const [idInput, setIdInput] = useState("");
  const [gameId, setGameId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [returning, setReturning] = useState<Player | null>(null);
  const [turns, setTurns] = useState<Turns>(null);
  const [loginError, setLoginError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ eventName: string; submissionsOpen: boolean }>("/api/config")
      .then(setConfig)
      .catch(() => setLoginError("Couldn't reach the server. Check your connection and reload."));
    try {
      setIdInput(localStorage.getItem(ID_KEY) ?? "");
    } catch {}
  }, []);

  useEffect(() => {
    if (config) document.title = config.eventName;
  }, [config]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const id = idInput.replace(/\D/g, "");
    if (!id) return setLoginError("Enter your game ID (numbers only).");
    setBusy(true);
    try {
      const res = await api<{ player: Player | null; turns: Turns; suggestion?: { name: string; alliance: string } | null }>(
        "/api/login",
        { method: "POST", body: { gameId: id } },
      );
      try {
        localStorage.setItem(ID_KEY, id);
      } catch {}
      const p = res.player;
      setForm(p ? { ...EMPTY, ...p } : { ...EMPTY, name: res.suggestion?.name ?? "", alliance: res.suggestion?.alliance ?? "" });
      setReturning(p);
      setTurns(res.turns);
      setSavedAt(p ? `Last saved ${new Date(p.updated_at).toLocaleString()}` : "");
      setSaveError("");
      setGameId(id);
      window.scrollTo(0, 0);
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    if (!form.name.trim()) return setSaveError("Enter your in-game name.");
    if (!form.d1_slots.length && !form.d4_slots.length) return setSaveError("Pick at least one time on Day 1 or Day 4.");
    setBusy(true);
    try {
      const { player } = await api<{ player: Player }>(`/api/players/${gameId}`, { method: "PUT", body: form });
      setReturning(player);
      setSavedAt(`Saved ${new Date(player.updated_at).toLocaleTimeString()}`);
      toast("Your sign-up is saved");
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  if (!gameId) {
    return (
      <main className="narrow">
        <section className="card">
          <div>
            <h1>Sign up for a KvK appointment</h1>
            <p className="muted">
              Players with the most speedups get the King&apos;s appointment first. Enter your game ID to start, or to
              change what you sent before.
            </p>
          </div>
          <form className="row" autoComplete="off" onSubmit={login}>
            <label className="field" style={{ flex: "1 1 220px" }}>
              Game ID
              <input
                type="text"
                inputMode="numeric"
                id="game-id"
                placeholder="e.g. 123456789"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                required
              />
              <span className="hint">Tap your avatar in game, then copy the ID number.</span>
            </label>
            <button className="btn" type="submit" disabled={busy} style={{ alignSelf: "flex-start", marginTop: 26 }}>
              Continue
            </button>
          </form>
          {loginError && <p className="error" role="alert">{loginError}</p>}
          {config && !config.submissionsOpen && (
            <div className="notice warn">Sign-ups are closed. You can still view the schedule.</div>
          )}
        </section>
      </main>
    );
  }

  const myTurns = turns && DAY_KEYS.filter((d) => turns[d] != null);

  return (
    <main className="narrow">
      <form className="stack" autoComplete="off" onSubmit={save}>
        <section className="card">
          <div className="card-head">
            <h2>Your details</h2>
            <button className="linkbtn" type="button" onClick={() => setGameId(null)}>
              Not you? Use another ID
            </button>
          </div>
          <div className="notice info">
            {returning
              ? `Welcome back, ${returning.name}. Change anything below and save again.`
              : "You're new here. Fill in your speedups, pick your times and save."}
          </div>
          {myTurns &&
            (myTurns.length ? (
              <div className="notice ok">
                Your appointment is set.{" "}
                {myTurns.map((d, i) => (
                  <span key={d}>
                    {i > 0 && " · "}
                    <b>{DAYS[d].label}:</b> {slotLabel(turns![d]!)} UTC ({localTime(turns![d]!)} your time)
                  </span>
                ))}
              </div>
            ) : (
              <div className="notice warn">
                The schedule is out and you don&apos;t have a turn this time. <Link href="/schedule">See the schedule</Link>.
              </div>
            ))}
          <div className="grid2">
            <label className="field">
              In-game name
              <input type="text" maxLength={30} required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="field">
              Alliance tag
              <input type="text" maxLength={8} placeholder="e.g. ABC" value={form.alliance} onChange={(e) => set("alliance", e.target.value)} />
            </label>
          </div>
          <p className="small muted">
            Game ID <b>{gameId}</b>
          </p>
        </section>

        {DAY_KEYS.map((day) => (
          <section className="card" key={`${gameId}-${day}`}>
            <div>
              <span className="day-badge">{DAYS[day].label}</span>
            </div>
            <div>
              <h2>{DAYS[day].title}</h2>
              <p className="muted small">
                {DAYS[day].position} appointment. Enter the speedups you will use on {DAYS[day].label}.
              </p>
            </div>
            <div className="grid2">
              {SPEED_FIELDS[day].map(([key, label]) => (
                <SpeedupInput
                  key={key}
                  id={key}
                  label={label}
                  value={form[key] as number}
                  onChange={(v) => set(key, v as Form[typeof key])}
                />
              ))}
            </div>
            <SlotPicker value={form[`${day}_slots`]} onChange={(v) => set(`${day}_slots`, v)} />
          </section>
        ))}

        <p className="small muted">
          Leave a day empty if you don&apos;t want an appointment that day. Pick more times to get a better chance.
        </p>

        <div className="savebar">
          <div className="in">
            {saveError ? <span className="error" role="alert">{saveError}</span> : <span className="small muted">{savedAt}</span>}
            <button className="btn" type="submit" disabled={busy}>
              Save my sign-up
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
