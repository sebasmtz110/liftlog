"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { getSupabase, isConfigured } from "../../lib/supabase";
import TabBar, { Sidebar } from "./TabBar";
import PageTransition from "./PageTransition";
import AuthScreen from "./AuthScreen";
import Quiz from "./Quiz";

const IMMERSIVE = ["/session", "/complete"];

const SECTIONS = [
  ["/exercises", "Library"],
  ["/workout", "Workouts"],
  ["/stats", "Progress"],
  ["/history", "History"],
  ["/profile", "Profile"],
  ["/settings", "Settings"],
  ["/help", "Help"],
  ["/coach", "Coach"],
  ["/health", "Health"],
];

function sectionName(pathname) {
  const hit = SECTIONS.find(([href]) => pathname.startsWith(href));
  return hit ? hit[1] : "Today";
}

function Shell({ children, withTabs }) {
  const pathname = usePathname() || "/";
  const immersive = IMMERSIVE.some((p) => pathname.startsWith(p));
  useEffect(() => {
    document.body.dataset.tone = immersive ? "workout" : "light";
    document.body.classList.toggle("is-immersive", immersive);
  }, [immersive]);

  return (
    <div className="app">
      {withTabs && !immersive && <Sidebar />}
      <div className="stage">
        {withTabs && !immersive && (
          <header className="topbar">
            <strong>{sectionName(pathname)}</strong>
            <Link href="/profile">Account</Link>
          </header>
        )}
        <PageTransition>{children}</PageTransition>
      </div>
      {withTabs && !immersive && <TabBar />}
    </div>
  );
}

/**
 * Decides what the app shell shows:
 *  - Supabase not configured -> the app as-is (ConfigBanner explains setup)
 *  - session loading         -> spinner
 *  - no user                 -> sign in / create account (no tab bar)
 *  - new user                -> onboarding quiz (no tab bar)
 *  - signed in               -> the app
 */
export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState(null); // null = unknown

  const checkOnboarding = useCallback(async () => {
    if (!user) {
      setOnboarded(null);
      return;
    }
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        setOnboarded(true);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        // profiles table may not exist yet (pre-migration) — don't block the app.
        setOnboarded(true);
        return;
      }
      setOnboarded(data?.onboarding_done ?? false);
    } catch {
      setOnboarded(true);
    }
  }, [user]);

  useEffect(() => {
    if (isConfigured && user) checkOnboarding();
  }, [user, checkOnboarding]);

  if (!isConfigured) return <Shell withTabs>{children}</Shell>;
  if (loading) {
    return (
      <Shell>
        <p className="loading">Loading…</p>
      </Shell>
    );
  }
  if (!user) {
    return (
      <Shell>
        <AuthScreen />
      </Shell>
    );
  }
  if (onboarded === null) {
    return (
      <Shell>
        <p className="loading">Loading…</p>
      </Shell>
    );
  }
  if (!onboarded) {
    return (
      <Shell>
        <Quiz userId={user.id} onDone={checkOnboarding} />
      </Shell>
    );
  }
  return <Shell withTabs>{children}</Shell>;
}
