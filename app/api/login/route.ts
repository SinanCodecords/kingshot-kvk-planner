import { fail, json, readBody, validGameId } from "@/lib/api";
import { getPlayer, playerTurns } from "@/lib/db";
import { lookupPlayer } from "@/lib/lookup";

// "Log in" with a game ID. Not secure on purpose: anyone who knows an ID can edit that entry.
export async function POST(req: Request) {
  const gameId = String((await readBody(req)).gameId ?? "").trim();
  if (!validGameId(gameId)) return fail(400, "Enter your game ID (numbers only).");
  const player = await getPlayer(gameId);
  if (player) return json({ player, turns: await playerTurns(gameId) });
  return json({ player: null, turns: null, suggestion: await lookupPlayer(gameId) });
}
