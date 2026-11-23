"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { dismissPwaBanner, isPwaBannerDismissed, type PwaInstallState } from "@/lib/pwa/usePwaInstall";

export interface PwaInstallBannerProps {
  pwa: PwaInstallState;
  onOpenInstallDialog: () => void;
}

export function PwaInstallBanner({ pwa, onOpenInstallDialog }: PwaInstallBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Only show if not standalone, is installable, and hasn't been dismissed
    if (!pwa.isStandalone && pwa.isInstallable && !isPwaBannerDismissed()) {
      setDismissed(false);
    } else {
      setDismissed(true);
    }
  }, [pwa.isStandalone, pwa.isInstallable]);

  if (dismissed || pwa.isStandalone) return null;

  const handleDismiss = () => {
    dismissPwaBanner();
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (pwa.hasPrompt) {
      const outcome = await pwa.promptInstall();
      if (outcome === "accepted") {
        setDismissed(true);
      }
    } else {
      onOpenInstallDialog();
    }
  };

  return (
    <div
      role="region"
      aria-label="App installation recommendation"
      className="pwa-install-banner fixed z-40 max-w-sm rounded-2xl bg-[#0a150f]/95 backdrop-blur-md border border-emerald-500/30 p-3 shadow-2xl shadow-black/80 transition-all duration-300 bottom-24 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto"
    >
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/apple-touch-icon.png"
          alt=""
          aria-hidden="true"
          className="w-9 h-9 rounded-xl object-contain border border-emerald-500/25 shrink-0"
        />
        <div className="flex-1 min-w-0 text-left">
          <strong className="block text-xs font-bold text-white truncate">
            Install Divido App
          </strong>
          <span className="block text-[11px] text-zinc-400 truncate">
            {pwa.isIos ? "Add to Home Screen" : "Fast native access & offline"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install recommendation"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
