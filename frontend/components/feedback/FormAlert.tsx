import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

/** A form-level message. Errors are announced immediately; notices politely. */
export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "info" | "warning";
  children: ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50/90 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-300";

  const Icon = tone === "error" ? AlertCircle : tone === "warning" ? AlertCircle : CheckCircle2;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2.5 transition-all ${styles}`}
    >
      <Icon size={15} className="shrink-0 opacity-80" aria-hidden="true" />
      <span className="leading-snug">{children}</span>
    </div>
  );
}
