"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TransactionDialogs, type TransactionDialogState } from "@/features/transactions/TransactionDialogs";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayNameFor } from "@/lib/auth/displayName";
import { formatMonthYear } from "@/lib/formatting/dates";
import type { Transaction, TransactionType } from "@/types/transaction";
import { AppShellContext, type AppShellActions } from "./AppShellContext";
import { AnimatedBackground } from "./AnimatedBackground";
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
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Safe to read storage up front: the shell renders only after the client-side session check.
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [dialog, setDialog] = useState<"help" | "signout" | null>(null);
  const [toast, setToast] = useState("");
  const [transactionDialog, setTransactionDialog] = useState<TransactionDialogState>(null);
  const [dataVersion, setDataVersion] = useState(0);

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

  const handleNavCloseSidebar = useCallback(() => {
    // Automatically close/collapse the slide-out navigation sidebar when an item is selected
    // so the destination page/content is showcased without obstruction.
    setCollapsed(true);
    try {
      localStorage.setItem(SIDEBAR_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const dismissToast = useCallback(() => setToast(""), []);

  const actions = useMemo<AppShellActions>(
    () => ({
      notify: setToast,
      openAdd: (type?: TransactionType) => setTransactionDialog(type ? { mode: "form", type } : { mode: "choose" }),
      openScan: () => setTransactionDialog({ mode: "scan" }),
      openTransaction: (transaction: Transaction) => setTransactionDialog({ mode: "detail", transaction }),
      openEdit: (transaction: Transaction) => setTransactionDialog({ mode: "form", type: transaction.type, transaction }),
      dataVersion,
      refreshData: () => setDataVersion((v) => v + 1),
    }),
    [dataVersion],
  );

  const userName = displayNameFor(user);
  const initials = userName ? userName.slice(0, 2).toUpperCase() : "DV";

  return (
    <AppShellContext.Provider value={actions}>
      <div className={`app-shell relative ${collapsed ? "sidebar-collapsed" : ""}`}>
        <AnimatedBackground />
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          userName={userName}
          initials={initials}
          onHelp={() => setDialog("help")}
          onSignOut={() => setDialog("signout")}
          onNavigate={handleNavCloseSidebar}
        />
        <div className="main-shell relative z-10">
          <TopBar
            userName={userName}
            email={user?.email ?? ""}
            initials={initials}
            onHelp={() => setDialog("help")}
            onSignOut={() => setDialog("signout")}
          />
          <main className="main-content">
            <div>
              {children}
            </div>
          </main>
        </div>
        <MobileDock
          onAdd={(type) => actions.openAdd(type)}
          onScan={actions.openScan}
          userName={userName}
          email={user?.email ?? ""}
          initials={initials}
          onHelp={() => setDialog("help")}
          onSignOut={() => setDialog("signout")}
        />
        <Toast message={toast} onDismiss={dismissToast} />
        <TransactionDialogs
          state={transactionDialog}
          onStateChange={setTransactionDialog}
          onSaved={(message, savedDate) => {
            setDataVersion((v) => v + 1);
            if (savedDate) {
              const savedMonth = savedDate.slice(0, 7);
              const formattedMonth = formatMonthYear(savedMonth);
              setToast(`${message} for ${formattedMonth}`);
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem("divido-active-month", savedMonth);
                } catch {
                  // ignore
                }
              }
              router.push(`${pathname}?month=${savedMonth}`, { scroll: false });
            } else {
              setToast(message);
            }
          }}
        />
        {dialog === "help" && <HelpDialog onClose={() => setDialog(null)} />}
        {dialog === "signout" && <SignOutDialog onClose={() => setDialog(null)} />}
      </div>
    </AppShellContext.Provider>
  );
}
