"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";

const ROWS = [
  { icon: "▦", label: "My Programs", href: "/workout" },
  { icon: "▤", label: "Exercise Library", href: "/exercises" },
  { icon: "⧉", label: "Workout Templates", href: "/workout" },
  { icon: "📈", label: "Progress & Stats", href: "/stats" },
  { icon: "⚙", label: "Settings", href: "/settings" },
  { icon: "?", label: "Help & Support", href: "/help" },
];

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState("Sebas");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!isConfigured) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        setEmail(user.email || "");
        const { data: prof } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (prof?.name) setName(prof.name);
      }
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <div className="profile-head">
          <div className="profile-avatar" aria-hidden="true">
            <img src="/avatar.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }} />
            <span style={{ position: "absolute" }}>{name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="title-2" style={{ fontSize: 24, lineHeight: "32px" }}>{name}</h1>
            <p className="body" style={{ color: "var(--mu)" }}>Build. Improve. Repeat.</p>
          </div>
        </div>
      </header>

      <div className="screen-body">
        <div className="menu-list">
          {ROWS.map((r) => (
            <button key={r.label} className="menu-row" onClick={() => router.push(r.href)}>
              <span className="menu-icon" aria-hidden="true">{r.icon}</span>
              <span className="headline">{r.label}</span>
              <span className="chev">›</span>
            </button>
          ))}
        </div>

        <div className="spacer-24" />

        {/* Better Than Yesterday card */}
        <div className="by-card">
          <img src="/hero-training.jpg" alt="" aria-hidden="true" />
          <div className="by-overlay" />
          <p className="by-text">Better<br />Than<br />Yesterday</p>
        </div>

        <div className="spacer-24" />

        <button className="btn btn-quiet btn-block" onClick={signOut}>
          Sign out{email ? ` (${email})` : ""}
        </button>
        <div className="spacer-32" />
      </div>
    </>
  );
}
