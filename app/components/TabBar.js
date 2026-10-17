"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Home", cls: "tab-home", d: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" },
  { href: "/workout", label: "Workout", cls: "tab-workout", d: "M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" },
  { href: "/exercises", label: "Exercises", cls: "tab-exercises", d: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" },
  { href: "/history", label: "History", cls: "tab-history", d: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3.5 2" },
  { href: "/stats", label: "Stats", cls: "tab-stats", d: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`tab ${t.cls}${active ? " active" : ""}`}>
            <Icon d={t.d} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
