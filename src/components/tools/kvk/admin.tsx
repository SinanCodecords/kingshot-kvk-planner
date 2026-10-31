"use client";

import { api } from "@convex/_generated/api";
import { useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { CalendarCheck, Copy, KeyRound, LogOut, Users, type LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { copyText, errorMessage, useStoredString } from "@/lib/client";
import { DAYS, DAY_KEYS, SLOTS } from "@/lib/kvk";
import { AdminDay } from "./admin-day";
import { AdminPlayers } from "./admin-players";
import { KvkNav } from "./kvk-nav";

export type Dashboard = NonNullable<FunctionReturnType<typeof api.kvk.admin.dashboard>>;

export function KvkAdmin() {
  const [password, setPassword] = useStoredString("kvk:adminPassword");

  return (
    <>
      <KvkNav />
      <PageHeader eyebrow="Admin" title="KvK control room" description="Run sign-ups, assign turns and publish the schedule.">
        {password && (
          <Button variant="outline" onClick={() => setPassword(null)}>
            <LogOut data-icon="inline-start" />
            Log out
          </Button>
        )}
      </PageHeader>
      {password === undefined ? null : password ? (
        <AdminDashboard password={password} onLogout={() => setPassword(null)} />
      ) : (
        <AdminLogin onLogin={setPassword} />
      )}
    </>
  );
}

function AdminLogin({ onLogin }: { onLogin: (password: string) => void }) {
  const convex = useConvex();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (await convex.query(api.kvk.admin.verify, { password: value })) onLogin(value);
      else toast.error("Wrong password.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="items-center text-center">
        <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <KeyRound className="size-6" />
        </span>
        <CardTitle className="text-xl">Admin login</CardTitle>
        <CardDescription>Enter the admin password set in Convex (ADMIN_PASSWORD).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Label htmlFor="admin-password" className="sr-only">
            Password
          </Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11"
          />
          <Button type="submit" className="h-11 text-base" disabled={!value || busy}>
            Log in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const data = useQuery(api.kvk.admin.dashboard, { password });

  if (data === undefined) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (data === null)
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Password no longer valid</CardTitle>
          <CardDescription>The admin password was changed. Log in again.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onLogout}>Log in again</Button>
        </CardContent>
      </Card>
    );

  return (
    <>
      <SettingsCard password={password} data={data} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={Users} label="Players signed up" value={data.players.length} />
        {DAY_KEYS.map((day) => {
          const filled = data.turns.filter((t) => t.day === day).length;
          return (
            <Stat
              key={day}
              icon={CalendarCheck}
              label={`${DAYS[day].label} · ${DAYS[day].position}`}
              value={`${filled}/${SLOTS.length}`}
              progress={filled / SLOTS.length}
            />
          );
        })}
      </div>
      <Tabs defaultValue="d1">
        <TabsList className="w-full">
          {DAY_KEYS.map((day) => (
            <TabsTrigger key={day} value={day} className="flex-1">
              {DAYS[day].label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="players" className="flex-1">
            All players
          </TabsTrigger>
        </TabsList>
        {DAY_KEYS.map((day) => (
          <TabsContent key={day} value={day} className="mt-4">
            <AdminDay password={password} day={day} data={data} />
          </TabsContent>
        ))}
        <TabsContent value="players" className="mt-4">
          <AdminPlayers password={password} data={data} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  progress,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  progress?: number;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        <span className="font-mono text-2xl font-bold">{value}</span>
        {progress !== undefined && (
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SettingsCard({ password, data }: { password: string; data: Dashboard }) {
  const update = useMutation(api.kvk.admin.updateSettings);
  const [eventName, setEventName] = useState(data.settings.eventName);

  const run = async (args: { eventName?: string; submissionsOpen?: boolean; schedulePublished?: boolean }, done: string) => {
    try {
      await update({ password, ...args });
      toast.success(done);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const link = (path: string) => `${window.location.origin}${path}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run({ eventName }, "Event name saved.");
          }}
        >
          <Label htmlFor="event-name">Event name</Label>
          <div className="flex gap-2">
            <Input
              id="event-name"
              maxLength={60}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="h-10"
            />
            <Button type="submit" variant="outline" className="h-10" disabled={eventName.trim() === data.settings.eventName}>
              Save
            </Button>
          </div>
        </form>
        <div className="flex flex-col divide-y rounded-lg border">
          <Toggle
            id="submissions-open"
            label="Sign-ups open"
            hint="Players can add and edit entries."
            checked={data.settings.submissionsOpen}
            onChange={(v) => run({ submissionsOpen: v }, v ? "Sign-ups opened." : "Sign-ups closed.")}
          />
          <Toggle
            id="schedule-published"
            label="Schedule published"
            hint="Players can see the schedule and their own turns."
            checked={data.settings.schedulePublished}
            onChange={(v) => run({ schedulePublished: v }, v ? "Schedule published." : "Schedule hidden.")}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-10" onClick={() => copyText(link("/kvk"), "Player link copied")}>
            <Copy data-icon="inline-start" />
            Copy player link
          </Button>
          <Button variant="outline" className="h-10" onClick={() => copyText(link("/kvk/schedule"), "Schedule link copied")}>
            <Copy data-icon="inline-start" />
            Copy schedule link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(v)} />
    </div>
  );
}
