"use client";

import { useEffect, useState } from "react";

/**
 * Smart install prompt — detects Android vs iOS and shows platform-specific
 * "Add to Home Screen" instructions. Dismissible, remembers dismissal,
 * hides when already installed as a PWA.
 */
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState(null); // "android" | "ios"
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    if (!isIOS && !isAndroid) return;

    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    // Dismissed before?
    try {
      if (localStorage.getItem("liftlog-install-dismissed") === "1") return;
    } catch (e) {}

    setPlatform(isAndroid ? "android" : "ios");
    // Small delay so it doesn't flash on first paint
    const t = setTimeout(() => setVisible(true), 1500);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem("liftlog-install-dismissed", "1");
    } catch (e) {}
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (e) {}
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible || !platform) return null;

  return (
    <div
      role="dialog"
      aria-label="Install LiftLog"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 84,
        zIndex: 60,
        background: "#141416",
        color: "#fff",
        borderRadius: 16,
        padding: "12px 14px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        boxShadow: "0 8px 28px rgba(0,0,0,.35)",
      }}
    >
      <img
        src="/icon-192.png"
        alt=""
        width={40}
        height={40}
        style={{ borderRadius: 10, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Install LiftLog</p>
        {platform === "android" ? (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B9B9C0", lineHeight: 1.4 }}>
            {deferredPrompt
              ? "Add LiftLog to your home screen for the full app experience."
              : "Tap Chrome menu \u22EE \u2192 Add to Home screen."}
          </p>
        ) : (
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#B9B9C0", lineHeight: 1.4 }}>
            Tap <strong style={{ color: "#fff" }}>Share</strong> \u2192{" "}
            <strong style={{ color: "#fff" }}>Add to Home Screen</strong>.
          </p>
        )}
      </div>
      {platform === "android" && deferredPrompt && (
        <button
          type="button"
          onClick={installAndroid}
          style={{
            background: "#0F706E",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          Install
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "#8E8E96",
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0,
        }}
      >
        \u00D7
      </button>
    </div>
  );
}
