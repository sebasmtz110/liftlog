"use client";

import { useState } from "react";
import { getSupabase } from "../../lib/supabase";

function friendlyError(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("user already registered")) return "That email already has an account — sign in instead.";
  if (m.includes("password")) return "Password must be at least 6 characters.";
  if (m.includes("email")) return "Enter a valid email address.";
  return message || "Something went wrong. Try again.";
}

export default function AuthScreen() {
  const [mode, setMode] = useState("signin");
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
      const supabase = await getSupabase();
      if (!supabase) {
        setError("Supabase isn't configured.");
        return;
      }
      const fn = mode === "signin"
        ? supabase.auth.signInWithPassword({ email: email.trim(), password })
        : supabase.auth.signUp({ email: email.trim(), password });
      const { error: err, data } = await fn;
      if (err) setError(friendlyError(err.message));
      else if (mode === "signup" && !data.session) {
        setError("Account created. If confirmation is on, check your email, then sign in.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen" data-screen="auth">
      <header className="page-head">
        <p className="eyebrow">LiftLog</p>
        <h1>{mode === "signin" ? "Welcome back" : "Create account"}</h1>
      </header>
      <form className="pad" onSubmit={submit}>
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" className="input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" className="input" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder={mode === "signin" ? "Your password" : "6+ characters"} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="err">{error}</p>}
        <button className="btn btn-mint btn-block" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <div style={{ height: 12 }} />
        <button className="btn btn-line btn-block" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
          {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
      </form>
    </section>
  );
}
