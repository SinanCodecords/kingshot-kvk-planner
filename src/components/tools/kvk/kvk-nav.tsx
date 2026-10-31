"use client";

import { CalendarDays, ClipboardPen, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/kvk", label: "Sign up", icon: ClipboardPen },
  { href: "/kvk/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/kvk", label: "Admin", icon: ShieldCheck },
];

// Switches between the KvK planner's pages.
export function KvkNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 rounded-xl bg-muted p-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex-none",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
