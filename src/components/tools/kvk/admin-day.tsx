"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Lock, LockOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { copyText, errorMessage } from "@/lib/client";
import {
  DAYS,
  SLOTS,
  dayScore,
  formatDuration,
  formatSlotLocal,
  playerLabel,
  rankPlayers,
  slotRangeUtc,
  slotUtc,
  useToday,
  type DayKey,
} from "@/lib/kvk";
import type { Dashboard } from "./admin";
import { ConfirmButton } from "./confirm-button";

const EMPTY = "__empty";

export function AdminDay({ password, day, data }: { password: string; day: DayKey; data: Dashboard }) {
  const autoAssign = useMutation(api.kvk.admin.autoAssign);
  const setTurn = useMutation(api.kvk.admin.setTurn);
  const setLocked = useMutation(api.kvk.admin.setLocked);
  const clearDay = useMutation(api.kvk.admin.clearDay);
  const [assigning, setAssigning] = useState(false);
  const today = useToday();

  const { players, turns } = data;
  const byId = useMemo(() => new Map(players.map((p) => [p.gameId, p])), [players]);
  const bySlot = useMemo(() => new Map(turns.filter((t) => t.day === day).map((t) => [t.slot, t])), [turns, day]);
  const turnOf = useMemo(() => new Map([...bySlot.values()].map((t) => [t.gameId, t.slot])), [bySlot]);
  const ranked = useMemo(() => rankPlayers(players, day), [players, day]);

  // Everyone can be placed by hand, highest speedups first.
  const options = useMemo(
    () => [
      { value: EMPTY, label: "— Empty —" },
      ...[...players]
        .sort((a, b) => dayScore(b, day) - dayScore(a, day) || a._creationTime - b._creationTime)
        .map((p) => ({ value: p.gameId, label: `${playerLabel(p)} · ${formatDuration(dayScore(p, day))}` })),
    ],
    [players, day],
  );

  const run = async (fn: () => Promise<unknown>, done?: string) => {
    try {
      await fn();
      if (done) toast.success(done);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const runAutoAssign = async () => {
    setAssigning(true);
    await run(async () => {
      const res = await autoAssign({ password, day });
      toast.success(`${res.filled}/${SLOTS.length} turns filled · ${res.waitlisted} on waitlist`);
    });
    setAssigning(false);
  };

  const chatText = () =>
    [
      `${data.settings.eventName} — ${DAYS[day].label} · ${DAYS[day].position} (UTC)`,
      ...SLOTS.flatMap((slot) => {
        const p = bySlot.get(slot) && byId.get(bySlot.get(slot)!.gameId);
        return p ? [`${slotUtc(slot)} ${playerLabel(p)}`] : [];
      }),
    ].join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {DAYS[day].label} · {DAYS[day].title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {DAYS[day].position}. Score = {DAYS[day].scoreHint.toLowerCase()}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={runAutoAssign} disabled={assigning}>
          {assigning ? "Assigning…" : "Auto-assign"}
        </Button>
        <Button variant="outline" onClick={() => copyText(chatText(), "Schedule copied for alliance chat")}>
          Copy schedule for chat
        </Button>
        <ConfirmButton
          title={`Clear ${DAYS[day].label}?`}
          description="Removes every turn on this day, including locked ones. Players stay signed up."
          actionLabel="Clear day"
          onConfirm={() => run(() => clearDay({ password, day }), `${DAYS[day].label} cleared.`)}
        >
          Clear day
        </ConfirmButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turns</CardTitle>
          <CardDescription>
            Auto-assign keeps locked turns. Picking a player by hand locks the turn and moves them off any other turn
            this day.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time (UTC)</TableHead>
                <TableHead className="min-w-56">Player</TableHead>
                <TableHead>Speedups</TableHead>
                <TableHead className="w-12">Lock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SLOTS.map((slot) => {
                const turn = bySlot.get(slot);
                const player = turn && byId.get(turn.gameId);
                return (
                  <TableRow key={slot}>
                    <TableCell>
                      <div className="font-mono">{slotRangeUtc(slot)}</div>
                      {today && <div className="text-xs text-muted-foreground">{formatSlotLocal(slot, today)}</div>}
                    </TableCell>
                    <TableCell>
                      <Select
                        items={options}
                        value={turn?.gameId ?? EMPTY}
                        onValueChange={(v) =>
                          run(() => setTurn({ password, day, slot, gameId: !v || v === EMPTY ? null : v }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          {options.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{player ? formatDuration(dayScore(player, day)) : "—"}</TableCell>
                    <TableCell>
                      {turn && (
                        <Button
                          variant={turn.locked ? "secondary" : "ghost"}
                          size="icon-sm"
                          aria-label={turn.locked ? "Unlock turn" : "Lock turn"}
                          onClick={() => run(() => setLocked({ password, day, slot, locked: !turn.locked }))}
                        >
                          {turn.locked ? <Lock /> : <LockOpen className="text-muted-foreground" />}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking</CardTitle>
          <CardDescription>
            Players with speedups and at least one picked time, most speedups first. Ties go to who signed up first.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Speedups</TableHead>
                <TableHead>Times picked</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((r, i) => {
                const slot = turnOf.get(r.player.gameId);
                return (
                  <TableRow key={r.player.gameId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{playerLabel(r.player)}</TableCell>
                    <TableCell>{formatDuration(r.score)}</TableCell>
                    <TableCell>{r.slots.length}</TableCell>
                    <TableCell>
                      {slot !== undefined ? (
                        <Badge>Has turn · {slotUtc(slot)}</Badge>
                      ) : (
                        <Badge variant="outline">Waiting</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {ranked.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nobody has signed up for {DAYS[day].label} yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
