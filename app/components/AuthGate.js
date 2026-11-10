"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  // Keep the app shell sized to the real viewport: iOS Safari's visual
  // viewport changes as toolbars collapse and the keyboard opens, and
  // 100dvh alone does not track it. The shell height comes from --app-h.
  //
  // Fold/unfold guard: mid-transition the visual viewport briefly reports
  // tiny or stale heights, and writing one collapses the whole shell to a
  // blank screen that stays stuck until the next resize. So implausibly
  // small readings are ignored, and every resize is re-measured once the
  // viewport has settled.
  useEffect(() => {
    const MIN_H = 240;
    let settleTimer = null;
    const update = () => {
      const vv = window.visualViewport;
      const h = vv && vv.scale <= 1.01 ? vv.height : window.innerHeight;
      if (h >= MIN_H) {
        document.documentElement.style.setProperty("--app-h", `${Math.round(h)}px`);
      }
    };
    const settle = () => {
      update();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(update, 350);
    };
    const onVisible = () => {
      if (!document.hidden) settle();
    };
    update();
    window.addEventListener("resize", settle);
    window.addEventListener("orientationchange", settle);
    window.addEventListener("pageshow", settle);
    document.addEventListener("visibilitychange", onVisible);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", settle);
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("resize", settle);
      window.removeEventListener("orientationchange", settle);
      window.removeEventListener("pageshow", settle);
      document.removeEventListener("visibilitychange", onVisible);
      if (window.visualViewport) window.visualViewport.removeEventListener("resize", settle);
    };
  }, []);

  return (
    <div className={withTabs && !immersive ? "app has-topbar" : "app"}>
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
 * Placeholder shown while the session/onboarding check is still running.
 * The shell (rail/tabs/topbar) renders immediately around it, so the app
 * never sits on a bare "Loading…" line while the check round-trips.
 */
function ShellSkeleton() {
  return (
    <section className="page" aria-hidden="true">
      <div className="skel-wrap">
        <div className="skel skel-title" />
        <div className="skel skel-line" />
        <div className="skel-tiles">
          <div className="skel skel-tile" />
          <div className="skel skel-tile" />
          <div className="skel skel-tile-wide" />
        </div>
        <div className="skel skel-line" />
        <div className="skel skel-block" />
      </div>
    </section>
  );
}

/**
 * Decides what the app shell shows:
 *  - Supabase not configured -> the app as-is (ConfigBanner explains setup)
 *  - session loading / onboarding check -> shell + skeleton (shell first)
 *  - no user                 -> sign in / create account (no tab bar)
 *  - new user                -> onboarding quiz (no tab bar)
 *  - signed in               -> the app
 */
export default function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [onboarded, setOnboarded] = useState(null); // null = unknown
  const checkRun = useRef(0);
  const sawSignIn = useRef(false);

  const checkOnboarding = useCallback(async () => {
    if (!user) {
      setOnboarded(null);
      return;
    }
    // Auth events fire in bursts right after sign-up; a slow earlier check
    // must never overwrite a newer answer (that flip-flop reads as a glitch).
    const run = ++checkRun.current;
    const stale = () => run !== checkRun.current;
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        if (!stale()) setOnboarded(true);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_done")
        .eq("id", user.id)
        .maybeSingle();
      if (stale()) return;
      if (error) {
        // profiles table may not exist yet (pre-migration) — don't block the app.
        setOnboarded(true);
        return;
      }
      setOnboarded(data?.onboarding_done ?? false);
    } catch {
      if (!stale()) setOnboarded(true);
    }
  }, [user]);

  // The quiz has already written onboarding_done by the time it calls this:
  // enter the app immediately instead of flashing a loading screen while the
  // re-check round-trips, then revalidate in the background.
  const handleOnboarded = useCallback(() => {
    setOnboarded(true);
    checkOnboarding();
  }, [checkOnboarding]);

  useEffect(() => {
    if (isConfigured && user) checkOnboarding();
  }, [user, checkOnboarding]);

  // Signing in (or creating an account) always lands on Today, not on
  // whatever page the browser happened to be sitting on — the account page
  // was the usual trap. Only a real pass through the sign-in screen counts:
  // a session simply restoring on app open keeps the current page.
  useEffect(() => {
    if (!loading && !user) sawSignIn.current = true;
  }, [loading, user]);

  useEffect(() => {
    if (user && sawSignIn.current) {
      sawSignIn.current = false;
      if (pathname !== "/") router.replace("/");
    }
  }, [user, pathname, router]);

  if (!isConfigured) return <Shell withTabs>{children}</Shell>;
  if (loading) {
    return (
      <Shell withTabs>
        <ShellSkeleton />
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
      <Shell withTabs>
        <ShellSkeleton />
      </Shell>
    );
  }
  if (!onboarded) {
    return (
      <Shell>
        <Quiz userId={user.id} onDone={handleOnboarded} />
      </Shell>
    );
  }
  return <Shell withTabs>{children}</Shell>;
}
