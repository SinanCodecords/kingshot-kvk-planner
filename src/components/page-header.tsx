import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, description, children }: { title: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← Kingshot Tools
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
