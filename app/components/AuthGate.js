"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase, isConfigured } from "../../lib/supabase";
import TabBar from "./TabBar";
import AuthScreen from "./AuthScreen";
import Quiz from "./Quiz";

function Shell({ children, withTabs }) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
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
