import { CalendarClock, type LucideIcon } from "lucide-react";

// Every tool in the hub. Add an entry here plus a route folder under src/app to add a tool.
export interface Tool {
  slug: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  links?: { label: string; href: string }[];
}

export const tools: Tool[] = [
  {
    slug: "kvk",
    name: "KvK Appointment Planner",
    description: "Sign up for Chief Minister and Noble Advisor turns. Most speedups get turns first.",
    href: "/kvk",
    icon: CalendarClock,
    links: [
      { label: "Schedule", href: "/kvk/schedule" },
      { label: "Admin", href: "/admin/kvk" },
    ],
  },
];
