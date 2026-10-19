"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { supabase, isConfigured } from "../../lib/supabase";
import TabBar, { Sidebar } from "./TabBar";
import AuthScreen from "./AuthScreen";
import Quiz from "./Quiz";

const IMMERSIVE = ["/session", "/complete"];

function Shell({ children, withTabs }) {
  const pathname = usePathname() || "/";
  useEffect(() => {
    const tone = pathname.startsWith("/stats")
      ? "progress"
      : pathname.startsWith("/session")
        ? "workout"
        : "light";
    document.body.dataset.tone = tone;
    document.body.classList.toggle("is-immersive", IMMERSIVE.some((p) => pathname.startsWith(p)));
  }, [pathname]);

  return (
    <div className="app">
      {withTabs && <Sidebar />}
      <div className="stage">{children}</div>
      {withTabs && <TabBar />}
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
