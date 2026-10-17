import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Hidden diagnostic endpoint — NOT linked in the UI.
 * Verifies Supabase connectivity with the anon key from env.
 * Returns counts only, never row contents.
 *
 * Example: GET /api/db-check
 * -> {"ok":true,"exercises":10,"workouts":3,"sets":42,"tables":{...}}
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "missing_env", tables: {} },
      { status: 500 }
    );
  }

  const sb = createClient(url, anonKey);
  const tables = {};
  let ok = true;

  for (const name of ["exercises", "workouts", "sets"]) {
    try {
      const { count, error } = await sb
        .from(name)
        .select("*", { count: "exact", head: true });
      if (error) {
        ok = false;
        tables[name] = { reachable: false, error: error.message };
      } else {
        tables[name] = { reachable: true, count: count ?? 0 };
      }
    } catch (e) {
      ok = false;
      tables[name] = { reachable: false, error: String(e?.message ?? e) };
    }
  }

  return NextResponse.json({
    ok,
    exercises: tables.exercises?.count ?? null,
    workouts: tables.workouts?.count ?? null,
    sets: tables.sets?.count ?? null,
    tables,
  });
}
