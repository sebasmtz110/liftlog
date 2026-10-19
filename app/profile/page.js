"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { getProfilePhoto, setProfilePhoto, migrateLegacyPhoto } from "../../lib/profilePhoto";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const ROWS = [
  { icon: "grid", label: "My Programs", href: "/workout" },
  { icon: "library", label: "Exercise Library", href: "/exercises" },
  { icon: "layers", label: "Workout Templates", href: "/workout" },
  { icon: "progress", label: "Progress & Stats", href: "/stats" },
  { icon: "gear", label: "Settings", href: "/settings" },
  { icon: "help", label: "Help & Support", href: "/help" },
];

export default function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState("/assets/avatar-default.jpg");

  useEffect(() => {
    if (!user?.id) return;
    migrateLegacyPhoto(user.id).then(() => {
      getProfilePhoto(user.id).then((p) => { if (p) setPhoto(p); });
    });
  }, [user]);

  useEffect(() => {
    if (!user || !isConfigured) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setName(data.display_name); });
  }, [user]);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await setProfilePhoto(file, user?.id);
      setPhoto(url);
    } catch { /* stays on device only */ }
  }

  return (
    <section className="screen" data-screen="profile">
      <ConfigBanner />
      <header className="profile-id">
        <label style={{ position: "relative", width: 64, height: 64, flex: "none" }}>
          <img src={photo} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
          <input type="file" accept="image/*" aria-label="Upload profile photo" onChange={onPhoto} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
        </label>
        <div>
          <h1>{name || "Your name"}</h1>
          <p>Build. Improve. Repeat.</p>
        </div>
      </header>
      <div className="menu">
        {ROWS.map((r) => (
          <button key={r.label} type="button" onClick={() => router.push(r.href)}>
            <Icon name={r.icon} />
            <span>{r.label}</span>
            <Icon name="chevron" className="icon chev" />
          </button>
        ))}
      </div>
      <button className="promo" type="button" onClick={() => router.push("/stats")}>
        <img src="/assets/better-yesterday.jpg" alt="" />
        <span className="promo-copy">Better<br />Than<br />Yesterday<i /></span>
      </button>
      <div className="pad">
        <button className="btn btn-line btn-block" type="button" onClick={signOut}>
          Sign out{user?.email ? ` · ${user.email}` : ""}
        </button>
      </div>
    </section>
  );
}
