import type { ReactNode } from "react";
import Link from "next/link";

/** Centred single-column layout with refined styling for sign-in, sign-up and setup pages. */
export function AuthPageShell({ title, children }: { title: string; children: ReactNode }) {
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
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
