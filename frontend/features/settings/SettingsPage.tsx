"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, Download, Lock, Settings as SettingsIcon, ShoppingBasket, Sliders, Trash2, Wallet } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { useAppShell } from "@/components/layout/AppShellContext";
import { usePwa } from "@/components/pwa/PwaManager";
import { useAuth } from "@/lib/auth/AuthProvider";
import { APP_TIME_ZONE } from "@/lib/formatting/dates";
import { DeleteAccountDialog, DisplayNameForm, PasswordForm } from "./AccountForms";
import { ClearTransactionsDialog } from "@/features/transactions/ClearTransactionsDialog";

/**
 * Settings (DIV-022, DEC-043): display name and password can change; email, currency,
 * timezone and language are fixed for the MVP. Account deletion is DIV-035 (DEC-046).
 */
export function SettingsPage() {
  const { user } = useAuth();
  const { notify, refreshData } = useAppShell();
  const { pwa, openInstallDialog } = usePwa();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearingTransactions, setClearingTransactions] = useState(false);

  return (
    <>
      <div className="settings-page-header mb-6">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
          YOUR PREFERENCES
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Profile & settings</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Personalize Divido and manage your local financial records.
        </p>
      </div>

      <div className="sr-only">
        <PageHeading title="Settings" />
      </div>

      <div className="settings-overview flex flex-col gap-6 max-w-4xl">
        {/* Card 1: Profile details */}
        <section className="panel settings-block bg-[#0d1611] border border-white/[0.07] rounded-3xl p-6 sm:p-7 shadow-lg" aria-labelledby="profile-heading">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0">
              <SettingsIcon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="profile-heading" className="text-base font-semibold text-white">Profile details</h2>
              <p className="text-xs text-zinc-400 mt-0.5">How you appear in your workspace.</p>
            </div>
          </div>
          <dl className="account-details account-email sr-only">
            <div>
              <dt>Email address</dt>
              <dd>{user?.email}</dd>
            </div>
          </dl>
          <DisplayNameForm key={user?.displayName} />
        </section>

        {/* Card 2: Your data */}
        <section className="panel settings-block bg-[#0d1611] border border-white/[0.07] rounded-3xl p-6 sm:p-7 shadow-lg" aria-labelledby="your-data-heading">
          <div className="flex items-start gap-3.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 id="your-data-heading" className="text-base font-semibold text-white">Your data</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Download a portable copy of the records stored in this browser.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4 border-t border-white/[0.06]">
            <div className="grid grid-cols-3 gap-6 sm:gap-14">
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">0</div>
                <div className="text-xs text-zinc-400 mt-0.5">Transactions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">0</div>
                <div className="text-xs text-zinc-400 mt-0.5">Budgets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">0</div>
                <div className="text-xs text-zinc-400 mt-0.5">Savings goal</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setClearingTransactions(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Trash2 size={14} aria-hidden="true" />
                Clear all transactions
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `divido-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#141f17] hover:bg-[#1b2b20] text-zinc-200 border border-white/10 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Export JSON
              </button>
            </div>
          </div>
        </section>

        <section className="panel settings-block" aria-labelledby="security-heading">
          <div className="settings-block-heading">
            <span className="group-icon" aria-hidden="true">
              <Lock size={20} />
            </span>
            <div>
              <h2 id="security-heading">Security</h2>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Changing your password updates your credentials and automatically invalidates any other active sessions.
          </p>
          <details
            className="profile-details"
            open={passwordOpen}
            onToggle={(e) => setPasswordOpen(e.currentTarget.open)}
          >
            <summary>Change password</summary>
            {passwordOpen && <PasswordForm onDone={() => setPasswordOpen(false)} />}
          </details>
        </section>

        <section className="settings-block" aria-labelledby="management-heading">
          <div className="section-heading">
            <div>
              <h2 id="management-heading">Management</h2>
              <p>Labels for your expenses and income</p>
            </div>
          </div>
          <div className="management-links">
            <Link className="panel management-link" href="/categories">
              <span className="group-icon" aria-hidden="true">
                <ShoppingBasket size={21} />
              </span>
              <div>
                <h3>Expense categories</h3>
                <p>Organise spending across your four groups.</p>
                <span>
                  Manage categories <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
            <Link className="panel management-link" href="/income-sources">
              <span className="group-icon" aria-hidden="true">
                <BriefcaseBusiness size={21} />
              </span>
              <div>
                <h3>Income sources</h3>
                <p>Optional labels for the income you record.</p>
                <span>
                  Manage income sources <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Card: Install App */}
        <section className="panel settings-block bg-[#0d1611] border border-white/[0.07] rounded-3xl p-6 sm:p-7 shadow-lg" aria-labelledby="app-install-heading">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0">
              <Download size={20} strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5">
                <h2 id="app-install-heading" className="text-base font-semibold text-white">App & Installation</h2>
                {pwa.isStandalone && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Check size={11} strokeWidth={2.8} /> Installed
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {pwa.isStandalone
                  ? "Divido is running in standalone mode on this device with full offline capabilities."
                  : "Install Divido on your iPhone, Android, or Desktop for full-screen view and quick home screen access."}
              </p>
            </div>
          </div>

          {!pwa.isStandalone && (
            <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-zinc-400">
                {pwa.isIos ? "Compatible with iOS Safari (Add to Home Screen)" : "Available for Android, Chrome, Edge, and macOS"}
              </div>
              <button
                type="button"
                onClick={openInstallDialog}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 self-start sm:self-auto"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Install Divido App</span>
              </button>
            </div>
          )}
        </section>

        <section className="panel settings-block" aria-labelledby="preferences-heading">
          <div className="settings-block-heading">
            <span className="group-icon" aria-hidden="true">
              <Sliders size={20} />
            </span>
            <div>
              <h2 id="preferences-heading">Financial preferences</h2>
            </div>
          </div>
          <dl className="regional-tiles">
            <div>
              <dt>Currency</dt>
              <dd>LKR</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{APP_TIME_ZONE}</dd>
              <small>Decides which month is “this month”</small>
            </div>
            <div>
              <dt>Language</dt>
              <dd>English</dd>
            </div>
          </dl>
        </section>

        <section className="panel settings-block danger-zone" aria-labelledby="clear-transactions-heading">
          <div>
            <h2 id="clear-transactions-heading">Clear all transactions</h2>
            <p>Permanently remove every recorded expense and income entry. Budgets, categories and settings remain intact.</p>
          </div>
          <Button variant="destructive" onClick={() => setClearingTransactions(true)}>
            Clear all transactions
          </Button>
        </section>

        <section className="panel settings-block danger-zone" aria-labelledby="delete-heading">
          <div>
            <h2 id="delete-heading">Delete account</h2>
            <p>Permanently delete your account and all of its data. This can&apos;t be undone.</p>
          </div>
          <Button variant="destructive" onClick={() => setDeleting(true)}>
            Delete account
          </Button>
        </section>
      </div>
      {clearingTransactions && (
        <ClearTransactionsDialog
          onCancel={() => setClearingTransactions(false)}
          onDone={(msg) => {
            setClearingTransactions(false);
            notify(msg);
            refreshData?.();
          }}
        />
      )}
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </>
  );
}
