"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../../lib/supabase";

const AuthCtx = createContext({ user: null, loading: true, signOut: async () => {} });

export function useAuth() {
  return useContext(AuthCtx);
}

/**
 * Tracks the Supabase session app-wide. The supabase-js client persists the
 * session in localStorage, so a refresh keeps the user signed in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    // Drop any in-progress workout pointer — it belonged to this user.
    try {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    } catch {}
    if (supabase) await supabase.auth.signOut();
  }

  return <AuthCtx.Provider value={{ user, loading, signOut }}>{children}</AuthCtx.Provider>;
}
