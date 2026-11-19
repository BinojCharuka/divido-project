"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TransactionDialogs, type TransactionDialogState } from "@/features/transactions/TransactionDialogs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayNameFor } from "@/lib/auth/displayName";
import type { Transaction, TransactionType } from "@/types/transaction";
import { AppShellContext, type AppShellActions } from "./AppShellContext";
import { PageTransitionProvider, usePageTransition } from "@/components/transition/PageTransitionContext";
import { HelpDialog } from "./HelpDialog";
import { MobileDock } from "./MobileDock";
import { Sidebar } from "./Sidebar";
import { SignOutDialog } from "./SignOutDialog";
import { Toast } from "./Toast";
import { TopBar } from "./TopBar";

const SIDEBAR_KEY = "divido-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * The signed-in layout: sidebar, top bar, mobile dock and the dialogs every page can
 * open. Render it only inside <SessionBoundary>.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageTransitionProvider>
      <AppShellInner>{children}</AppShellInner>
    </PageTransitionProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { phase, isTransitioning, triggerReveal } = usePageTransition();
  const contentRef = useRef<HTMLDivElement>(null);
  // Safe to read storage up front: the shell renders only after the client-side session check.
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [dialog, setDialog] = useState<"help" | "signout" | null>(null);
  const [toast, setToast] = useState("");
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Coordinate destination page readiness behind the curtain
  useEffect(() => {
    if (phase !== "preparing") return;

    const checkReady = () => {
      if (!contentRef.current) return false;
      // If a loading panel is still mounted, not ready yet
      const loading = contentRef.current.querySelector(
        ".loading-panel, [role='status']:not(.page-transition-curtain)",
      );
      if (loading) return false;
      return contentRef.current.children.length > 0;
    };

    if (checkReady()) {
      const frameId = requestAnimationFrame(() => triggerReveal());
      return () => cancelAnimationFrame(frameId);
    }

    const observer = new MutationObserver(() => {
      if (checkReady()) {
        observer.disconnect();
        triggerReveal();
      }
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }

    // Safety timeout: never leave user on black screen if a request stalls or fails
    const timer = setTimeout(() => {
      observer.disconnect();
      triggerReveal();
    }, 1800);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pathname, phase, triggerReveal]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {
        // Storage unavailable: the choice lasts for this page only.
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setToast(""), []);

  const actions = useMemo<AppShellActions>(
    () => ({
      notify: setToast,
      openAdd: (type?: TransactionType) => setTransactionDialog(type ? { mode: "form", type } : { mode: "choose" }),
      openTransaction: (transaction: Transaction) => setTransactionDialog({ mode: "detail", transaction }),
      openEdit: (transaction: Transaction) => setTransactionDialog({ mode: "form", type: transaction.type, transaction }),
      dataVersion,
    }),
    [dataVersion],
  );

  const userName = displayNameFor(user);
  const initials = userName ? userName.slice(0, 2).toUpperCase() : "DV";

  return (
    <AppShellContext.Provider value={actions}>
      <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          userName={userName}
          initials={initials}
          onHelp={() => setDialog("help")}
          onSignOut={() => setDialog("signout")}
        />
        <div className="main-shell">
          <TopBar
            userName={userName}
            email={user?.email ?? ""}
            initials={initials}
            onHelp={() => setDialog("help")}
            onSignOut={() => setDialog("signout")}
          />
          <main className={`main-content ${isTransitioning && phase === "preparing" ? "page-outgoing" : ""}`}>
            <div
              ref={contentRef}
              key={pathname}
              className={`page-transition-host ${phase === "swiping" ? "page-upward-swipe-enter" : ""} ${phase === "preparing" ? "page-preparing-hidden" : ""}`}
            >
              {children}
            </div>
          </main>
        </div>
        <MobileDock onAdd={() => actions.openAdd()} />
        <Toast message={toast} onDismiss={dismissToast} />
        <TransactionDialogs
          state={transactionDialog}
          onStateChange={setTransactionDialog}
          onSaved={(message) => {
            setDataVersion((v) => v + 1);
            setToast(message);
          }}
        />
        {dialog === "help" && <HelpDialog onClose={() => setDialog(null)} />}
        {dialog === "signout" && <SignOutDialog onClose={() => setDialog(null)} />}
      </div>
    </AppShellContext.Provider>
  );
}
