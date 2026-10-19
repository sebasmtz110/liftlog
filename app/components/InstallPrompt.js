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
    <>
      <style>{`@keyframes liftlog-prompt-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    <div
      role="dialog"
      aria-label="Install LiftLog"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(10px + env(safe-area-inset-bottom))",
        zIndex: 60,
        background: "#FFFFFF",
        color: "#1A1A1A",
        border: "1px solid #E8E8E8",
        borderRadius: 14,
        padding: "8px 10px",
        display: "flex",
        gap: 10,
        alignItems: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,.12)",
        animation: "liftlog-prompt-in .45s cubic-bezier(.2,.9,.25,1) both",
      }}
    >
      <img
        src="data:image/png;base64,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"
        alt=""
        width={32}
        height={32}
        style={{ borderRadius: 8, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Install LiftLog</p>
        {platform === "android" ? (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B6B70", lineHeight: 1.4 }}>
            {deferredPrompt
              ? "Add LiftLog to your home screen for the full app experience."
              : "Tap Chrome menu \u22EE \u2192 Add to Home screen."}
          </p>
        ) : (
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B6B70", lineHeight: 1.4 }}>
            Tap <strong style={{ color: "#1A1A1A" }}>Share</strong> \u2192{" "}
            <strong style={{ color: "#1A1A1A" }}>Add to Home Screen</strong>.
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
            borderRadius: 8,
            padding: "7px 12px",
            fontWeight: 700,
            fontSize: 12,
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
          color: "#A0A0A8",
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0,
        }}
      >
        \u00D7
      </button>
    </div>
    </>
  );
}
