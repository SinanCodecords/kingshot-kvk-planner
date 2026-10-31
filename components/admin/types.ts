import type { Assignment, DayKey, Player } from "@/lib/schedule";

export interface Settings {
  event_name: string;
  submissions_open: boolean;
  schedule_published: boolean;
}

export interface RankRow {
  game_id: string;
  score: number;
  assigned: boolean;
}

export interface AdminState {
  settings: Settings;
  players: Player[];
  days: Record<DayKey, { assignments: Assignment[]; ranking: RankRow[] }>;
}

// Runs an API call, shows its message, then reloads the dashboard.
export type Act = (call: () => Promise<unknown>, message?: string) => Promise<void>;
