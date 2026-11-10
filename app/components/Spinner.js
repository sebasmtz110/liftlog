"use client";

/**
 * Circular loading spinner. Replaces the bare "Loading…" text lines:
 * same centered <p className="loading"> wrapper, no copy.
 * role="status" + aria-label keeps it announced to screen readers.
 */
export default function Spinner({ label = "Loading" }) {
  return <span className="spinner" role="status" aria-label={label} />;
}
