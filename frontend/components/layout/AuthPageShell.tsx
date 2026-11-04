import type { ReactNode } from "react";
import Link from "next/link";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
}

/** Centred single-column layout with refined styling for sign-in, sign-up and setup pages. */
export function AuthPageShell({ title, subtitle, eyebrow, children }: AuthPageShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Link href="/" aria-label="Divido Home">
          <div className="brand brand-full">
            <img
              src="/webp/logo-fulls.webp"
              alt="Divido"
              className="brand-logo-img light-only"
              height={48}
            />
            <img
              src="/webp/logo-fulls-dark.webp"
              alt="Divido"
              className="brand-logo-img dark-only"
              height={48}
            />
          </div>
        </Link>
      </div>
      <div className="auth-card">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="auth-subtitle text-xs text-muted mt-1">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
