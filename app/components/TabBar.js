"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useAuth } from "./AuthContext";
import { supabase, isConfigured } from "../../lib/supabase";
import { getProfilePhoto } from "../../lib/profilePhoto";

const TABS = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/workout", label: "Workouts", icon: "workouts" },
  { href: "/exercises", label: "Library", icon: "library" },
  { href: "/stats", label: "Progress", icon: "progress" },
  { href: "/history", label: "History", icon: "clock" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={active ? "is-active" : ""}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [name, setName] = useState("LiftLog");
  const [photo, setPhoto] = useState("/assets/avatar.jpg");

  useEffect(() => {
    getProfilePhoto().then((p) => { if (p) setPhoto(p); });
  }, [user]);

  useEffect(() => {
    if (!user || !isConfigured) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setName(data.display_name); });
  }, [user]);

  return (
    <aside className="sidebar">
      <Link className="brand" href="/profile">
        <img src={photo} alt="" />
        <span>
          <strong>{name}</strong>
          <em>Build. Improve. Repeat.</em>
        </span>
      </Link>
      <nav className="side-nav" aria-label="Primary">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={active ? "is-active" : ""}>
              <Icon name={t.icon} />
              {t.label}
            </Link>
          );
        })}
      </nav>
      <p className="side-quote">Discipline builds freedom.</p>
    </aside>
  );
}
