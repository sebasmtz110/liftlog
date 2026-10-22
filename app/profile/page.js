"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { getProfilePhoto, setProfilePhoto, migrateLegacyPhoto } from "../../lib/profilePhoto";
import ConfigBanner from "../components/ConfigBanner";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

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
    getSupabase().then((supabase) => {
      if (!supabase) return;
      supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
        .then(({ data }) => { if (data?.display_name) setName(data.display_name); });
    });
  }, [user]);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await setProfilePhoto(file, user?.id);
      setPhoto(url);
    } catch { /* stays on this device */ }
  }

  const links = [
    ["/workout", "Split"],
    ["/exercises", "Library"],
    ["/stats", "Progress"],
    ["/history", "History"],
    ["/coach", "Coach"],
    ["/settings", "Settings"],
    ["/help", "Help"],
  ];
  if (user?.email === SEBAS_EMAIL) links.push(["/health", "Health"]);

  return (
    <section className="page">
      <ConfigBanner />
      <div className="title-row">
        <div>
          <h1>{name || "Profile"}</h1>
          <p className="lede">{user?.email || "Signed in on this browser."}</p>
        </div>
        <label className="icon-btn" style={{ width: 56, height: 56, padding: 0, overflow: "hidden", borderRadius: 8 }}>
          <img src={photo} alt="" style={{ width: 56, height: 56, objectFit: "cover" }} />
          <input type="file" accept="image/*" aria-label="Change profile photo" onChange={onPhoto} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }} />
        </label>
      </div>
      <p className="note">The photo stays in this browser and is not uploaded.</p>
      <nav className="panel menu" style={{ marginTop: 16 }} aria-label="Account">
        {links.map(([href, label]) => (
          <button key={href} type="button" onClick={() => router.push(href)}>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="btn btn-line" type="button" style={{ marginTop: 16 }} onClick={signOut}>Sign out</button>
    </section>
  );
}
