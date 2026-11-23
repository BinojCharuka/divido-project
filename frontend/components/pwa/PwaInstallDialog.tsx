"use client";

import Image from "next/image";
import { Check, Download, Monitor, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { PwaInstallState } from "@/lib/pwa/usePwaInstall";

export interface PwaInstallDialogProps {
  open: boolean;
  onClose: () => void;
  pwa: PwaInstallState;
}

export function PwaInstallDialog({ open, onClose, pwa }: PwaInstallDialogProps) {
  if (!open) return null;

  const handleInstallClick = async () => {
    const result = await pwa.promptInstall();
    if (result === "accepted" || result === "dismissed") {
      onClose();
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Install Divido"
      className="pwa-install-dialog max-w-md bg-[#0a120d] border border-white/[0.08] text-zinc-100 p-6 rounded-3xl shadow-2xl"
    >
      <div className="flex flex-col items-center text-center">
        {/* App Icon preview */}
        <div className="w-16 h-16 rounded-2xl bg-[#070b09] border border-emerald-500/30 p-2 flex items-center justify-center shadow-lg shadow-emerald-950/40 mb-4 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apple-touch-icon.png"
            alt="Divido App Icon"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <h3 className="text-xl font-bold text-white tracking-tight">
          {pwa.isIos ? "Install Divido on iPhone" : "Install Divido App"}
        </h3>
        <p className="text-xs text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
          {pwa.isIos
            ? "Add Divido to your Home Screen for a full-screen, native app experience with zero browser bars."
            : "Install Divido on your device for instantaneous launch, offline security, and standalone performance."}
        </p>

        {/* iOS Step-by-Step Instructions */}
        {pwa.isIos && (
          <div className="w-full bg-[#101c14] border border-emerald-500/20 rounded-2xl p-4 my-5 text-left flex flex-col gap-3.5">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Share size={15} strokeWidth={2.4} />
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white block font-semibold">1. Tap Share</strong>
                Tap the Share icon in Safari&apos;s bottom toolbar.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <PlusSquare size={15} strokeWidth={2.4} />
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white block font-semibold">2. Add to Home Screen</strong>
                Scroll down and select <span className="text-emerald-400 font-medium">Add to Home Screen</span>.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={15} strokeWidth={2.4} />
              </div>
              <div className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white block font-semibold">3. Tap Add</strong>
                Confirm by tapping <span className="text-emerald-400 font-medium">Add</span> in the top right corner.
              </div>
            </div>
          </div>
        )}

        {/* Android / Desktop browser instructions or prompt button */}
        {!pwa.isIos && (
          <div className="w-full bg-[#101c14] border border-white/[0.08] rounded-2xl p-4 my-5 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                {pwa.isAndroid ? <Smartphone size={16} /> : <Monitor size={16} />}
              </div>
              <span className="text-xs font-semibold text-white">
                {pwa.isAndroid ? "Android Home Screen" : "Desktop App & Dock"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {pwa.hasPrompt
                ? "Click the button below to install Divido natively on this device."
                : "You can also install via your browser menu (⋮) -> 'Install Divido' or 'Add to Desktop'."}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full mt-2">
          {pwa.hasPrompt ? (
            <>
              <Button
                variant="primary"
                onClick={handleInstallClick}
                className="flex-1 !bg-emerald-500 hover:!bg-emerald-400 !text-zinc-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                <Download size={16} strokeWidth={2.4} />
                <span>Install Now</span>
              </Button>
              <Button
                variant="secondary"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={onClose}
              className="w-full !bg-emerald-500 hover:!bg-emerald-400 !text-zinc-950 font-bold py-2.5 rounded-xl"
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
