import localFont from "next/font/local";

/**
 * Inter via next/font/local: the exact same self-hosted woff2 files that
 * used to be served from /public/fonts, but now next/font preloads them,
 * applies font-display swap, and emits a size-adjusted @font-face with an
 * adjusted fallback so there's no layout shift. Exposed as the `--font`
 * variable so globals.css keeps using var(--font) unchanged (same family,
 * weights, and system fallbacks).
 */
export const inter = localFont({
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font",
});
