"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, Lock, LogOut, Swords } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { errorMessage, useStoredString } from "@/lib/client";
import {
  DAYS,
  DAY_KEYS,
  formatDuration,
  formatSlotLocal,
  localTimeZone,
  slotRangeUtc,
  useToday,
  type DayKey,
} from "@/lib/kvk";
import { DurationInput } from "./duration-input";
import { KvkNav } from "./kvk-nav";
import { SlotGrid } from "./slot-grid";

type Entry = {
  name: string;
  alliance: string;
  d1Construction: number;
  d1Research: number;
  d1General: number;
  d4Training: number;
  d4General: number;
  d1Slots: number[];
  d4Slots: number[];
};

const EMPTY: Entry = {
  name: "",
  alliance: "",
  d1Construction: 0,
  d1Research: 0,
  d1General: 0,
  d4Training: 0,
  d4General: 0,
  d1Slots: [],
  d4Slots: [],
};

const SPEEDUP_FIELDS: Record<DayKey, { key: keyof Entry; label: string }[]> = {
  d1: [
    { key: "d1Construction", label: "Construction speedups" },
    { key: "d1Research", label: "Research speedups" },
    { key: "d1General", label: "General speedups for Day 1" },
  ],
  d4: [
    { key: "d4Training", label: "Training speedups" },
    { key: "d4General", label: "General speedups for Day 4" },
  ],
};

export function KvkSignup() {
  const settings = useQuery(api.kvk.schedule.settings);
  const [gameId, setGameId] = useStoredString("kvk:gameId");

  return (
    <>
      <KvkNav />
      <PageHeader
        eyebrow={settings?.eventName ?? "KvK"}
        title="Appointment sign-up"
        description="Enter your speedups and the times you can play. The most speedups get turns first."
      >
        {settings && (
          <Badge variant={settings.submissionsOpen ? "success" : "secondary"}>
            {settings.submissionsOpen ? "Sign-ups open" : "Sign-ups closed"}
          </Badge>
        )}
      </PageHeader>
      {gameId === undefined ? null : gameId ? (
        <PlayerArea gameId={gameId} onSwitch={() => setGameId(null)} submissionsOpen={settings?.submissionsOpen} />
      ) : (
        <LoginCard onLogin={setGameId} />
      )}
    </>
  );
}

function LoginCard({ onLogin }: { onLogin: (gameId: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) onLogin(value.trim());
  };
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="items-center text-center">
        <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Swords className="size-6" />
        </span>
        <CardTitle className="text-xl">Enter your game ID</CardTitle>
        <CardDescription>No password needed. Use the same ID later to edit your entry or see your turn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Label htmlFor="game-id" className="sr-only">
            Game ID
          </Label>
          <Input
            id="game-id"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Game ID"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 text-center font-mono text-lg tracking-wider"
          />
          <Button type="submit" className="h-11 text-base" disabled={!value.trim()}>
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PlayerArea({
  gameId,
  onSwitch,
  submissionsOpen,
}: {
  gameId: string;
  onSwitch: () => void;
  submissionsOpen: boolean | undefined;
}) {
  const entry = useQuery(api.kvk.players.get, { gameId });
  const turns = useQuery(api.kvk.players.myTurns, { gameId });
  const initials = (entry?.name || "?").slice(0, 2).toUpperCase();

  return (
    <>
      <Card size="sm">
        <CardContent className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {entry ? (entry.alliance ? `[${entry.alliance}] ${entry.name}` : entry.name) : "New player"}
            </p>
            <p className="text-xs text-muted-foreground">
              ID <span className="font-mono">{gameId}</span>
              {entry && <span className="text-success"> · Signed up</span>}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onSwitch}>
            <LogOut data-icon="inline-start" />
            Switch
          </Button>
        </CardContent>
      </Card>

      {turns && entry && <MyTurns turns={turns} entry={entry} />}

      {submissionsOpen === false && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-warning" />
          <div>
            <p className="font-medium">Sign-ups are closed</p>
            <p className="text-muted-foreground">You can no longer change your entry. Ask your King or R4 if something is wrong.</p>
          </div>
        </div>
      )}

      {entry !== undefined && submissionsOpen !== undefined && (
        <SignupForm key={gameId} gameId={gameId} initial={entry ?? EMPTY} isNew={!entry} disabled={!submissionsOpen} />
      )}
    </>
  );
}

function MyTurns({ turns, entry }: { turns: { day: DayKey; slot: number }[]; entry: Entry }) {
  const today = useToday();
  return (
    <Card className="ring-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          Your turns
        </CardTitle>
        <CardDescription>The schedule is out. Be online at the start of your turn.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {DAY_KEYS.map((day) => {
          const mine = turns.filter((t) => t.day === day);
          const signedUp = (day === "d1" ? entry.d1Slots : entry.d4Slots).length > 0;
          return (
            <div key={day} className="flex flex-col gap-1 rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {DAYS[day].label} · {DAYS[day].position}
              </p>
              {mine.length > 0 ? (
                mine.map((t) => (
                  <div key={t.slot}>
                    <p className="font-mono text-xl font-bold text-primary">{slotRangeUtc(t.slot)}</p>
                    <p className="text-xs text-muted-foreground">
                      UTC{today && ` · ${formatSlotLocal(t.slot, today)} your time`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm">
                  {signedUp ? "No turn yet — you're on the waitlist." : "You didn't pick any times for this day."}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function SignupForm({
  gameId,
  initial,
  isNew,
  disabled,
}: {
  gameId: string;
  initial: Entry;
  isNew: boolean;
  disabled: boolean;
}) {
  const save = useMutation(api.kvk.players.save);
  const today = useToday();
  const [form, setForm] = useState<Entry>(() => ({
    name: initial.name,
    alliance: initial.alliance,
    d1Construction: initial.d1Construction,
    d1Research: initial.d1Research,
    d1General: initial.d1General,
    d4Training: initial.d4Training,
    d4General: initial.d4General,
    d1Slots: initial.d1Slots,
    d4Slots: initial.d4Slots,
  }));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Entry>(key: K, value: Entry[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await save({ gameId, ...form });
      toast.success(res.created ? "You're signed up" : "Entry updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <StepTitle step={1} title={isNew ? "Your details" : "Edit your details"} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">In-game name</Label>
            <Input
              id="name"
              required
              maxLength={40}
              disabled={disabled}
              placeholder="Your name in Kingshot"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="alliance">Alliance tag</Label>
            <Input
              id="alliance"
              maxLength={10}
              disabled={disabled}
              placeholder="ABC"
              value={form.alliance}
              onChange={(e) => set("alliance", e.target.value)}
              className="h-10 uppercase"
            />
          </div>
        </CardContent>
      </Card>

      {DAY_KEYS.map((day, i) => {
        const total = SPEEDUP_FIELDS[day].reduce((sum, f) => sum + (form[f.key] as number), 0);
        const slotsKey = day === "d1" ? "d1Slots" : "d4Slots";
        return (
          <Card key={day}>
            <CardHeader>
              <StepTitle step={i + 2} title={`${DAYS[day].label} · ${DAYS[day].title}`} />
              <CardDescription className="pl-10">
                Appointment: <span className="font-medium text-foreground">{DAYS[day].position}</span>. Skip if you
                won&apos;t play this day.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                {SPEEDUP_FIELDS[day].map((f) => (
                  <DurationInput
                    key={f.key}
                    id={f.key}
                    label={f.label}
                    value={form[f.key] as number}
                    disabled={disabled}
                    onChange={(minutes) => set(f.key, minutes)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
                <span className="text-sm font-medium">{DAYS[day].label} total</span>
                <span className="font-mono text-xl font-bold text-primary">{formatDuration(total)}</span>
              </div>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="font-medium">Times you can play</p>
                <p className="text-xs text-muted-foreground">
                  Pick every turn you can be online for. Big numbers are UTC
                  {today ? `, small numbers are your time (${localTimeZone()})` : ""}.
                </p>
              </div>
              <SlotGrid value={form[slotsKey]} onChange={(s) => set(slotsKey, s)} disabled={disabled} />
            </CardContent>
          </Card>
        );
      })}

      {!disabled && (
        <div className="sticky bottom-0 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="submit" className="h-12 w-full text-base sm:w-auto sm:px-8" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Sign up" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}

function StepTitle({ step, title }: { step: number; title: string }) {
  return (
    <CardTitle className="flex items-center gap-3 text-base">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {step}
      </span>
      {title}
    </CardTitle>
  );
}
