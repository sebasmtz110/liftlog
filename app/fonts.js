import localFont from "next/font/local";

/** Geist for the draft visual system. Self-hosted. */
export const geist = localFont({
  src: [
    { path: "./fonts/geist-400.ttf", weight: "400", style: "normal" },
    { path: "./fonts/geist-500.ttf", weight: "500", style: "normal" },
    { path: "./fonts/geist-700.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-geist",
});

/** Barlow for the app. Self-hosted so the face is the one the screens measure. */
export const barlow = localFont({
  src: [
    { path: "./fonts/barlow-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/barlow-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/barlow-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/barlow-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font",
});

/** Inter stays on the exercise library, which keeps its own design. */
export const inter = localFont({
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});
