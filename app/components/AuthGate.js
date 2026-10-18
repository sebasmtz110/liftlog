"use client";

import { useAuth } from "./AuthContext";
import { isConfigured } from "../../lib/supabase";
import TabBar from "./TabBar";
import AuthScreen from "./AuthScreen";

/**
 * Decides what the app shell shows:
 *  - Supabase not configured -> the app as-is (ConfigBanner explains setup)
 *  - session loading         -> spinner
 *  - no user                 -> sign in / create account (no tab bar)
 *  - signed in               -> the app
 */
export default function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (!isConfigured) {
    return (
      <div className="app-shell">
        <main className="app-main">{children}</main>
        <TabBar />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <p className="loading">Loading…</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <AuthScreen />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      <TabBar />
    </div>
  );
}
