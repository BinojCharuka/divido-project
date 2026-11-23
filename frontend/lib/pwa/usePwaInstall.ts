"use client";

import { useEffect, useState, useCallback } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface PwaInstallState {
  isStandalone: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isInstallable: boolean;
  hasPrompt: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "show-ios-guide" | "show-instructions">;
}

const DISMISS_KEY = "divido-pwa-banner-dismissed";

export function isPwaBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export function dismissPwaBanner(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISS_KEY, "true");
  } catch {
    // ignore
  }
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone mode (already installed & launched from home screen / desktop)
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isNavStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isDisplayStandalone || isNavStandalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = () => checkStandalone();
    try {
      mediaQuery.addEventListener("change", handleMediaChange);
    } catch {
      mediaQuery.addListener(handleMediaChange);
    }

    // Platform detection
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const android = /android/.test(ua);
    const safari = /^((?!chrome|android).)*safari/.test(ua);

    setIsIos(Boolean(ios));
    setIsAndroid(Boolean(android));
    setIsSafari(Boolean(safari));

    // Register Service Worker in production/supported clients
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });
    }

    // Capture standard Chromium/Edge beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      try {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "show-ios-guide" | "show-instructions"> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choice.outcome;
      } catch {
        return "show-instructions";
      }
    }

    if (isIos) {
      return "show-ios-guide";
    }

    return "show-instructions";
  }, [deferredPrompt, isIos]);

  const hasPrompt = Boolean(deferredPrompt);
  const isInstallable = !isStandalone && (hasPrompt || isIos || isSafari || isAndroid);

  return {
    isStandalone,
    isIos,
    isAndroid,
    isSafari,
    isInstallable,
    hasPrompt,
    promptInstall,
  };
}
