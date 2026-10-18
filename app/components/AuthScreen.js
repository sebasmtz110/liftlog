"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

/** Human-friendly message for the common Supabase auth errors. */
function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("user already registered")) return "That email already has an account — sign in instead.";
  if (m.includes("password")) return "Password must be at least 6 characters.";
  if (m.includes("email")) return "Enter a valid email address.";
  return message || "Something went wrong. Try again.";
}

/**
 * Sign in / create-account screen. Shown by AuthGate when there is no
 * session. Uses Supabase email+password auth — no extra packages needed.
 */
export default function AuthScreen() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      const fn =
        mode === "signin"
          ? supabase.auth.signInWithPassword({ email: email.trim(), password })
          : supabase.auth.signUp({ email: email.trim(), password });
      const { error } = await fn;
      if (error) setError(friendlyError(error.message));
      // On success onAuthStateChange fires and AuthGate swaps to the app.
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="screen-head">
        <p className="kicker">LIFTLOG</p>
        <h1 className="large-title">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
        <p className="footnote">
          {mode === "signin"
            ? "Sign in to see your workouts."
            : "One account per lifter — your workouts are yours alone."}
        </p>
      </header>

      <div className="screen-body">
        <form className="card" onSubmit={submit}>
          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder={mode === "signin" ? "Your password" : "6+ characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <>
              <div className="spacer-12" />
              <p className="footnote" style={{ color: "var(--bad)" }}>{error}</p>
            </>
          )}
          <div className="spacer-16" />
          <button className="btn btn-filled" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="spacer-12" />
        <button
          className="btn btn-plain"
          style={{ width: "100%" }}
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
          }}
        >
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </>
  );
}
