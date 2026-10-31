import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "muted" | "bordered";
}

export function Card({ children, variant = "default", className = "", ...props }: CardProps) {
  const variantStyles = {
    default: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs",
    muted: "bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800",
    bordered: "bg-transparent border border-zinc-200 dark:border-zinc-800",
  }[variant];

  return (
    <div className={`rounded-xl p-5 ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
}
