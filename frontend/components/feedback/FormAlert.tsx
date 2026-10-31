import type { ReactNode } from "react";

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
      ? "border-red-700 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-950 dark:text-red-100"
      : tone === "warning"
      ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-100"
      : "border-zinc-400 bg-zinc-50 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-100";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </div>
  );
}
