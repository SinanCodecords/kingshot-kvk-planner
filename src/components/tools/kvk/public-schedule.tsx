"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAYS, DAY_KEYS, SLOTS, formatSlotLocal, localTimeZone, playerLabel, slotRangeUtc, useToday } from "@/lib/kvk";

export function PublicSchedule() {
  const schedule = useQuery(api.kvk.schedule.published);
  const [search, setSearch] = useState("");
  const today = useToday();
  const q = search.trim().toLowerCase();

  return (
    <>
      <PageHeader
        title={schedule ? `${schedule.eventName} schedule` : "KvK schedule"}
        description={`Turns are 30 minutes. Times are UTC${today ? `, with your time (${localTimeZone()})` : ""}.`}
      >
        <Link href="/kvk" className={buttonVariants({ variant: "outline" })}>
          Sign up / my turns
        </Link>
      </PageHeader>

      {schedule === null && (
        <Card>
          <CardHeader>
            <CardTitle>Not published yet</CardTitle>
            <CardDescription>The schedule will show here once the King publishes it.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {schedule && (
        <>
          <Input
            type="search"
            placeholder="Search by name or alliance"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10"
          />
          <Tabs defaultValue="d1">
            <TabsList className="w-full sm:w-auto">
              {DAY_KEYS.map((day) => (
                <TabsTrigger key={day} value={day}>
                  {DAYS[day].label} · {DAYS[day].position}
                </TabsTrigger>
              ))}
            </TabsList>
            {DAY_KEYS.map((day) => {
              const bySlot = new Map(schedule.turns.filter((t) => t.day === day).map((t) => [t.slot, t]));
              const rows = SLOTS.map((slot) => ({ slot, turn: bySlot.get(slot) })).filter(
                ({ turn }) => !q || (turn && playerLabel(turn).toLowerCase().includes(q)),
              );
              return (
                <TabsContent key={day} value={day} className="mt-2">
                  <p className="mb-2 text-sm text-muted-foreground">
                    {DAYS[day].title} · {bySlot.size}/{SLOTS.length} turns filled
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Time (UTC)</TableHead>
                        <TableHead>Player</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(({ slot, turn }) => (
                        <TableRow key={slot}>
                          <TableCell className="align-top">
                            <div className="font-mono">{slotRangeUtc(slot)}</div>
                            {today && <div className="text-xs text-muted-foreground">{formatSlotLocal(slot, today)}</div>}
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            {turn ? playerLabel(turn) : <span className="text-muted-foreground">Open</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            No match on {DAYS[day].label}.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              );
            })}
          </Tabs>
        </>
      )}
    </>
  );
}
