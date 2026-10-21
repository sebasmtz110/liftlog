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
        src="/assets/install-icon.png"
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
