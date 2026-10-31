"use client";

import { api } from "@convex/_generated/api";
import { useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
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

export type Dashboard = NonNullable<FunctionReturnType<typeof api.kvk.admin.dashboard>>;

export function KvkAdmin() {
  const [password, setPassword] = useStoredString("kvk:adminPassword");

  return (
    <>
      <PageHeader title="KvK admin" description="Run sign-ups, assign turns and publish the schedule.">
        {password && (
          <Button variant="outline" onClick={() => setPassword(null)}>
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
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Admin login</CardTitle>
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
            className="h-10"
          />
          <Button type="submit" size="lg" className="h-10" disabled={!value || busy}>
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
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Players signed up" value={data.players.length} />
        {DAY_KEYS.map((day) => (
          <Stat
            key={day}
            label={`${DAYS[day].label} turns filled`}
            value={`${data.turns.filter((t) => t.day === day).length}/${SLOTS.length}`}
          />
        ))}
      </div>
      <Tabs defaultValue="d1">
        <TabsList className="w-full sm:w-auto">
          {DAY_KEYS.map((day) => (
            <TabsTrigger key={day} value={day}>
              {DAYS[day].label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="players">All players</TabsTrigger>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xl font-semibold sm:text-2xl">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
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
            <Input id="event-name" maxLength={60} value={eventName} onChange={(e) => setEventName(e.target.value)} />
            <Button type="submit" variant="outline" disabled={eventName.trim() === data.settings.eventName}>
              Save
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-3">
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
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => copyText(link("/kvk"), "Player link copied")}>
            Copy player link
          </Button>
          <Button variant="outline" onClick={() => copyText(link("/kvk/schedule"), "Schedule link copied")}>
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
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(v)} />
    </div>
  );
}
