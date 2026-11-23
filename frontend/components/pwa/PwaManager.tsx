"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePwaInstall, type PwaInstallState } from "@/lib/pwa/usePwaInstall";
import { PwaInstallDialog } from "./PwaInstallDialog";
import { PwaInstallBanner } from "./PwaInstallBanner";

export interface PwaContextType {
  pwa: PwaInstallState;
  openInstallDialog: () => void;
  closeInstallDialog: () => void;
}

const PwaContext = createContext<PwaContextType | null>(null);

export function usePwa(): PwaContextType {
  const context = useContext(PwaContext);
  if (!context) {
    // Graceful fallback for components rendered outside PwaProvider (e.g. in isolated tests)
    return {
      pwa: {
        isStandalone: false,
        isIos: false,
        isAndroid: false,
        isSafari: false,
        isInstallable: false,
        hasPrompt: false,
        promptInstall: async () => "show-instructions",
      },
      openInstallDialog: () => {},
      closeInstallDialog: () => {},
    };
  }
  return context;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const pwa = usePwaInstall();
  const [dialogOpen, setDialogOpen] = useState(false);

  const openInstallDialog = () => setDialogOpen(true);
  const closeInstallDialog = () => setDialogOpen(false);

  return (
    <PwaContext.Provider value={{ pwa, openInstallDialog, closeInstallDialog }}>
      {children}
      <PwaInstallBanner pwa={pwa} onOpenInstallDialog={openInstallDialog} />
      <PwaInstallDialog open={dialogOpen} onClose={closeInstallDialog} pwa={pwa} />
    </PwaContext.Provider>
  );
}
