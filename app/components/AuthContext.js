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
    let sub;
    let cancelled = false;
    (async () => {
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      });
      const { data } = await supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;
        setUser(session?.user ?? null);
      });
      sub = data;
    })();
    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
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
