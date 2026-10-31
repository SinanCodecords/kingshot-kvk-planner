"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
      <PageHeader
        title={settings?.eventName ? `${settings.eventName} sign-up` : "KvK sign-up"}
        description="Enter your speedups and the times you can play. Most speedups get turns first."
      >
        <Link href="/kvk/schedule" className={buttonVariants({ variant: "outline" })}>
          View schedule
        </Link>
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
    <Card>
      <CardHeader>
        <CardTitle>Log in with your game ID</CardTitle>
        <CardDescription>
          No password needed. Use the same ID later to edit your entry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <Label htmlFor="game-id" className="sr-only">
            Game ID
          </Label>
          <Input
            id="game-id"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Your game ID"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-10"
          />
          <Button type="submit" size="lg" className="h-10" disabled={!value.trim()}>
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
        <span>
          Game ID <span className="font-mono font-medium">{gameId}</span>
          {entry && <Badge variant="secondary" className="ml-2">Signed up</Badge>}
        </span>
        <Button variant="ghost" size="sm" onClick={onSwitch}>
          Switch ID
        </Button>
      </div>

      {turns && entry && <MyTurns turns={turns} entry={entry} />}

      {submissionsOpen === false && (
        <Card>
          <CardHeader>
            <CardTitle>Sign-ups are closed</CardTitle>
            <CardDescription>You can no longer change your entry. Ask your King or R4 if something is wrong.</CardDescription>
          </CardHeader>
        </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Your turns</CardTitle>
        <CardDescription>The schedule is published. Be online for your turn.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {DAY_KEYS.map((day) => {
          const mine = turns.filter((t) => t.day === day);
          const signedUp = (day === "d1" ? entry.d1Slots : entry.d4Slots).length > 0;
          return (
            <div key={day} className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                {DAYS[day].label} · {DAYS[day].position}
              </p>
              {mine.length > 0 ? (
                mine.map((t) => (
                  <p key={t.slot} className="text-sm">
                    <span className="font-mono font-semibold">{slotRangeUtc(t.slot)} UTC</span>
                    {today && <span className="text-muted-foreground"> · {formatSlotLocal(t.slot, today)} your time</span>}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {signedUp ? "No turn — you are on the waitlist." : "You did not sign up for this day."}
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
      toast.success(res.created ? "You're signed up!" : "Your entry was updated.");
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
          <CardTitle>{isNew ? "Your details" : "Edit your entry"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">In-game name</Label>
            <Input
              id="name"
              required
              maxLength={40}
              disabled={disabled}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="alliance">Alliance tag</Label>
            <Input
              id="alliance"
              maxLength={10}
              disabled={disabled}
              placeholder="e.g. ABC"
              value={form.alliance}
              onChange={(e) => set("alliance", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {DAY_KEYS.map((day) => {
        const total = SPEEDUP_FIELDS[day].reduce((sum, f) => sum + (form[f.key] as number), 0);
        const slotsKey = day === "d1" ? "d1Slots" : "d4Slots";
        return (
          <Card key={day}>
            <CardHeader>
              <CardTitle>
                {DAYS[day].label} · {DAYS[day].title}
              </CardTitle>
              <CardDescription>
                Appointment: {DAYS[day].position}. Leave empty if you are not playing this day.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
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
              <p className="text-sm">
                Total for {DAYS[day].label}: <span className="font-semibold">{formatDuration(total)}</span>
              </p>
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Times you can play</p>
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
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Sign up" : "Save changes"}
          </Button>
        </div>
      )}
    </form>
  );
}
