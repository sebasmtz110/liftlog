"use client";

import { isConfigured } from "../../lib/supabase";

/** Shown when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. */
export default function ConfigBanner() {
  if (isConfigured) return null;
  return (
    <div className="config-banner" role="alert">
      Supabase isn&apos;t connected yet. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment (see README), then
      redeploy.
    </div>
  );
}
