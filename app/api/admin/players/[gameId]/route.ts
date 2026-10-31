import { adminOnly, json } from "@/lib/api";
import { deletePlayer } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return adminOnly(async () => {
    await deletePlayer(gameId);
    return json({ ok: true });
  });
}
