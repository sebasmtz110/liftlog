"use client";

import { useEffect } from "react";

/** Registers the service worker (production only) so repeat opens serve
 *  the app shell from the on-device cache instead of re-downloading it. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
