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
  { href: "/workout", label: "Workouts", cls: "tab-workout", d: "M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" },
  { href: "/exercises", label: "Library", cls: "tab-exercises", d: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z M4 20.5A2.5 2.5 0 0 1 6.5 18H20" },
  { href: "/stats", label: "Progress", cls: "tab-stats", d: "M4 20V10M10 20V4M16 20v-8M22 20H2" },
  { href: "/history", label: "History", cls: "tab-history", d: "M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3.5 2" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={`tab ${t.cls}${active ? " on" : ""}`}>
            <Icon d={t.d} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
