"use client";

import { useEffect } from "react";
import { supabase, isConfigured } from "../../lib/supabase";

const TIMEOUT_MS = 8000;

function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("foreground-refresh-timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** True when there is no session or it expires within the next minute. */
function needsRefresh(session) {
  if (!session) return true;
  const expMs = (session.expires_at ?? 0) * 1000;
  return expMs - Date.now() < 60_000;
}

/**
 * iOS suspends background tabs: the supabase-js auto-refresh timer never
 * fires, the access token expires, and data queries made with the dead
 * token hang — the app looks frozen and only a force-close fixes it.
 *
 * When the tab comes back to the foreground, re-validate the session and
 * refresh it (wrapped in a timeout so this can never hang the UI). If the
 * session can't be recovered, sign out so the auth gate renders instead of
 * a stuck spinner.
 */
export default function ForegroundRefresh() {
  useEffect(() => {
    if (!isConfigured || !supabase) return;
    let cancelled = false;

    async function onForeground() {
      if (document.visibilityState !== "visible" || cancelled) return;
      try {
        const { data } = await withTimeout(supabase.auth.getSession());
        if (cancelled) return;
        if (!needsRefresh(data.session)) return;
        const { error } = await withTimeout(supabase.auth.refreshSession());
        if (cancelled) return;
        if (error) throw error;
      } catch {
        // Session is unrecoverable — clear it so the auth gate renders
        // instead of leaving the app stuck on a dead session.
        if (cancelled) return;
        try {
          await withTimeout(supabase.auth.signOut());
        } catch {
          try {
            await supabase.auth.signOut({ scope: "local" });
          } catch {}
        }
      }
    }

    document.addEventListener("visibilitychange", onForeground);
    window.addEventListener("pageshow", onForeground);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onForeground);
      window.removeEventListener("pageshow", onForeground);
    };
  }, []);

  return null;
}
