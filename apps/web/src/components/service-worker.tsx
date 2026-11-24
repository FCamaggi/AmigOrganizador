"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` (offline page) in production builds. Skipped in
 * development so a worker never sits between hot reloads and the page.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // The app works without it; only the offline page is lost.
      });
  }, []);
  return null;
}
