"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../../lib/supabase";

const AuthCtx = createContext({ user: null, loading: true, signOut: async () => {} });

export function useAuth() {
  return useContext(AuthCtx);
}

/**
 * Tracks the Supabase session app-wide. The supabase-js client persists the
 * session in localStorage, so a refresh keeps the user signed in.
 *
 * The client is created lazily (getSupabase) so supabase-js isn't part of
 * any page's initial JS bundle — it loads on first auth check.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    let subscription;
    let cancelled = false;
    (async () => {
      try {
        const supabase = await getSupabase();
        if (!supabase || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        let sawAuthEvent = false;
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          sawAuthEvent = true;
          setUser(session?.user ?? null);
          setLoading(false);
        });
        subscription = data.subscription;
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (cancelled || sawAuthEvent) return;
        if (!error) setUser(sessionData.session?.user ?? null);
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  async function signOut() {
    // Drop any in-progress workout pointer — it belonged to this user.
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    } catch {}
    const supabase = await getSupabase();
    if (supabase) await supabase.auth.signOut();
  }

  return <AuthCtx.Provider value={{ user, loading, signOut }}>{children}</AuthCtx.Provider>;
}
