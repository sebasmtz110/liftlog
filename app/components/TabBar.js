"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useAuth } from "./AuthContext";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

const TABS = [
  { href: "/", label: "Today", icon: "home" },
  { href: "/workout", label: "Workouts", icon: "workouts" },
  { href: "/exercises", label: "Library", icon: "library" },
  { href: "/stats", label: "Progress", icon: "progress" },
];

const MORE = [
  { href: "/history", label: "History" },
  { href: "/coach", label: "Coach" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
  { href: "/help", label: "Help" },
];

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="3" y="12" width="22" height="4" rx="1" fill="#ffffff" />
      <rect x="7" y="8" width="3" height="12" rx="1" fill="#ffffff" />
      <rect x="18" y="8" width="3" height="12" rx="1" fill="#ffffff" />
    </svg>
  );
}

function active(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function TabBar() {
  const pathname = usePathname() || "/";
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={active(pathname, t.href) ? "is-active" : ""}>
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const more = user?.email === SEBAS_EMAIL ? [...MORE, { href: "/health", label: "Health" }] : MORE;
  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <Mark />
        LiftLog
      </Link>
      <nav className="side-nav" aria-label="Primary">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={active(pathname, t.href) ? "is-active" : ""}>
            <Icon name={t.icon} />
            {t.label}
          </Link>
        ))}
      </nav>
      <nav className="side-foot" aria-label="Account">
        {more.map((t) => (
          <Link key={t.href} href={t.href} className={active(pathname, t.href) ? "is-active" : ""}>
            {t.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
