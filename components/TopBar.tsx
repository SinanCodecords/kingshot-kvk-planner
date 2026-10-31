"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopBar() {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  return (
    <header className="topbar">
      <div className="in">
        <Link href={admin ? "/admin" : "/"} className="logo" style={{ textDecoration: "none", opacity: 1 }}>
          <span className="crown" aria-hidden="true">♛</span>
          <span>{admin ? "Admin" : "KvK Appointments"}</span>
        </Link>
        <nav>
          {admin ? (
            <>
              <Link href="/" target="_blank">Player page</Link>
              <Link href="/schedule" target="_blank">Schedule page</Link>
            </>
          ) : path === "/schedule" ? (
            <Link href="/">Sign up or change my times</Link>
          ) : (
            <Link href="/schedule">View schedule</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
