import type { ReactNode } from "react";
import Link from "next/link";

/** Centred single-column layout with refined styling for sign-in, sign-up and setup pages. */
export function AuthPageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand">
          <span className="brand-symbol" aria-hidden="true">
            <span />
            <span />
          </span>
          <span>
            divido<span className="brand-dot">.</span>
          </span>
        </div>
      </div>
      <div className="auth-card">
        <h1>{title}</h1>
        {children}
        <div className="inline-note" style={{ textAlign: "center" }}>
          <Link href="/dashboard" className="text-xs text-teal-600 dark:text-teal-400 underline font-medium">
            ← Continue to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
