"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, CircleUserRound, Lock, Moon, ShoppingBasket, Sliders, Sun } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { APP_TIME_ZONE } from "@/lib/formatting/dates";
import { useDividoTheme } from "@/lib/theme";
import { DeleteAccountDialog, DisplayNameForm, PasswordForm } from "./AccountForms";

/**
 * Settings (DIV-022, DEC-043): display name and password can change; email, currency,
 * timezone and language are fixed for the MVP. Account deletion is DIV-035 (DEC-046).
 */
export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useDividoTheme();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <PageHeading title="Settings" />
      <div className="settings-overview">
        <section className="panel settings-block" aria-labelledby="profile-heading">
          <div className="settings-block-heading">
            <span className="group-icon" aria-hidden="true">
              <CircleUserRound size={20} />
            </span>
            <div>
              <h2 id="profile-heading">Profile</h2>
            </div>
          </div>
          <dl className="account-details account-email">
            <div>
              <dt>Email address</dt>
              <dd>{user?.email}</dd>
            </div>
          </dl>
          <DisplayNameForm key={user?.displayName} />
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

        <section className="panel settings-block" aria-labelledby="appearance-heading">
          <div className="settings-block-heading">
            <span className="group-icon" aria-hidden="true">
              {theme === "light" ? <Sun size={20} /> : <Moon size={20} />}
            </span>
            <div>
              <h2 id="appearance-heading">Appearance</h2>
            </div>
          </div>
          <div className="theme-options" role="group" aria-label="Colour theme">
            {(["light", "dark"] as const).map((mode) => (
              <Button
                key={mode}
                className={`theme-option ${theme === mode ? "selected" : ""}`}
                aria-pressed={theme === mode}
                onClick={() => setTheme(mode)}
              >
                {mode === "light" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
                {mode === "light" ? "Light" : "Dark"}
                {theme === mode && <Check size={16} aria-hidden="true" />}
              </Button>
            ))}
          </div>
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
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
    </>
  );
}
