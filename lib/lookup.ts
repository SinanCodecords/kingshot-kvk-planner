import "server-only";

// Optional: fill in a new player's name and alliance from their game ID.
// Uses the MightPulse API (same as the open-source kingdom-appt-planner) when
// MIGHTPULSE_API_KEY is set. Without a key, players type their name.
export async function lookupPlayer(gameId: string): Promise<{ name: string; alliance: string } | null> {
  const key = process.env.MIGHTPULSE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.mightpulse.com/v1/players/${gameId}`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok || !data.player) return null;
    return { name: String(data.player.nick_name || ""), alliance: String(data.player.alliance?.abbr || "") };
  } catch {
    return null;
  }
}
