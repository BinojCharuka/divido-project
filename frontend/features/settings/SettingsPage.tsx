"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, CircleUserRound, Moon, ShoppingBasket, Sun } from "lucide-react";
import { displayNameFor } from "@/lib/auth/displayName";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { APP_TIME_ZONE } from "@/lib/formatting/dates";
import { useDividoTheme } from "@/lib/theme";

/**
 * Settings. Profile editing waits for the profile API (DIV-022, decision required),
 * so account details are read-only here.
 */
export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useDividoTheme();

  return (
    <>
      <PageHeading title="Settings" />
      <div className="settings-overview">
        <section className="panel settings-block" aria-labelledby="account-heading">
          <div className="settings-block-heading">
            <span className="group-icon" aria-hidden="true">
              <CircleUserRound size={20} />
            </span>
            <div>
              <h2 id="account-heading">Account</h2>
            </div>
          </div>
          <dl className="account-details">
            <div>
              <dt>Email address</dt>
              <dd>{user?.email}</dd>
            </div>
            <div>
              <dt>Shown as</dt>
              <dd>{displayNameFor(user?.email)}</dd>
            </div>
          </dl>
          <p className="settings-note">Editing your profile will come in a later update.</p>
        </section>

        <section className="settings-block" aria-labelledby="money-heading">
          <div className="section-heading">
            <div>
              <h2 id="money-heading">Your money labels</h2>
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

        <section className="panel settings-block" aria-labelledby="region-heading">
          <div className="settings-block-heading">
            <div>
              <h2 id="region-heading">Region</h2>
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
      </div>
    </>
  );
}
