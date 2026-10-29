import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary" | "tertiary" | "danger";
  loading?: boolean;
};

/** A consistent action control with a visible keyboard focus state. */
export function Button({ children, tone = "primary", loading = false, className, disabled, ...props }: ButtonProps) {
  const styles = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] focus-visible:ring-[var(--focus)] disabled:bg-[#91aa9c]",
    secondary:
      "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-muted)] focus-visible:ring-[var(--focus)] disabled:text-[#89918d]",
    tertiary: "text-[var(--primary-strong)] hover:bg-[#e7f0e9] focus-visible:ring-[var(--focus)] disabled:text-[#89918d]",
    danger: "bg-[#a64035] text-white hover:bg-[#863229] focus-visible:ring-[#863229] disabled:bg-[#d09a92]",
  } satisfies Record<NonNullable<ButtonProps["tone"]>, string>;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none ring-offset-2 transition focus-visible:ring-2 disabled:cursor-not-allowed ${styles[tone]} ${className ?? ""}`}
    >
      {loading && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
