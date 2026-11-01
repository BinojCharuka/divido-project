import type { ReactNode } from "react";
import Link from "next/link";

/** Centred single-column layout with Figma styling for sign-in, sign-up and setup pages. */
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
        <span className="eyebrow">A LITTLE CLARITY, EVERY DAY</span>
        <h1>{title}</h1>
        <p>A more mindful relationship with your money starts here.</p>
        {children}
        <div className="inline-note flex flex-col gap-2">
          <span>Connects to your real Divido account and Spring Boot session.</span>
          <Link href="/dashboard" className="text-xs text-teal-600 dark:text-teal-400 underline font-medium">
            ← Explore Divido Demo Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
