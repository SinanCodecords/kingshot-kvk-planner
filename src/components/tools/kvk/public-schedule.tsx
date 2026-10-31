"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { CalendarX2, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStoredString } from "@/lib/client";
import { DAYS, DAY_KEYS, SLOTS, formatSlotLocal, localTimeZone, slotRangeUtc, useToday } from "@/lib/kvk";
import { cn } from "@/lib/utils";
import { KvkNav } from "./kvk-nav";

export function PublicSchedule() {
  const schedule = useQuery(api.kvk.schedule.published);
  const [gameId] = useStoredString("kvk:gameId");
  const myTurns = useQuery(api.kvk.players.myTurns, gameId ? { gameId } : "skip");
  const [search, setSearch] = useState("");
  const [filledOnly, setFilledOnly] = useState(false);
  const today = useToday();
  const q = search.trim().toLowerCase();
  const isMine = (day: string, slot: number) => !!myTurns?.some((t) => t.day === day && t.slot === slot);

  return (
    <>
      <KvkNav />
      <PageHeader
        eyebrow={schedule?.eventName ?? "KvK"}
        title="Appointment schedule"
        description={`30-minute turns. Times are UTC${today ? `, with your time (${localTimeZone()}) underneath` : ""}.`}
      />

      {schedule === null && (
        <Card className="items-center py-10 text-center">
          <CardHeader className="items-center">
            <CalendarX2 className="mx-auto mb-2 size-8 text-muted-foreground" />
            <CardTitle>Not published yet</CardTitle>
            <CardDescription>The schedule shows up here once the King publishes it.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {schedule && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or alliance"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="filled-only" checked={filledOnly} onCheckedChange={(v) => setFilledOnly(v)} />
              <Label htmlFor="filled-only" className="text-sm">
                Hide open turns
              </Label>
            </div>
          </div>
          <Tabs defaultValue="d1">
            <TabsList className="w-full">
              {DAY_KEYS.map((day) => (
                <TabsTrigger key={day} value={day} className="flex-1">
                  {DAYS[day].label} · {DAYS[day].position}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAY_KEYS.map((day) => {
              const bySlot = new Map(schedule.turns.filter((t) => t.day === day).map((t) => [t.slot, t]));
              const rows = SLOTS.map((slot) => ({ slot, turn: bySlot.get(slot) })).filter(
                ({ turn }) =>
                  (!filledOnly || turn) &&
                  (!q || (turn && `${turn.alliance} ${turn.name}`.toLowerCase().includes(q))),
              );
              return (
                <TabsContent key={day} value={day} className="mt-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{DAYS[day].title}</span>
                    <span>
                      <span className="font-semibold text-primary">{bySlot.size}</span>
                      <span className="text-muted-foreground">/{SLOTS.length} filled</span>
                    </span>
                  </div>
                  <ul className="flex flex-col overflow-hidden rounded-xl border bg-card">
                    {rows.map(({ slot, turn }) => {
                      const mine = isMine(day, slot);
                      return (
                        <li
                          key={slot}
                          className={cn(
                            "flex items-center gap-4 border-b px-4 py-3 last:border-b-0",
                            mine && "bg-primary/10",
                          )}
                        >
                          <div className="w-28 shrink-0">
                            <p className={cn("font-mono text-sm font-semibold", mine && "text-primary")}>
                              {slotRangeUtc(slot)}
                            </p>
                            {today && <p className="text-xs text-muted-foreground">{formatSlotLocal(slot, today)}</p>}
                          </div>
                          {turn ? (
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              {turn.alliance && (
                                <Badge variant="secondary" className="font-mono">
                                  {turn.alliance}
                                </Badge>
                              )}
                              <span className="truncate font-medium">{turn.name}</span>
                              {mine && <Badge className="ml-auto">You</Badge>}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Open</span>
                          )}
                        </li>
                      );
                    })}
                    {rows.length === 0 && (
                      <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No match on {DAYS[day].label}.
                      </li>
                    )}
                  </ul>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      )}
    </>
  );
}
