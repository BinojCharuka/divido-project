import type { ReactNode } from "react";

/** Centred single-column layout for the sign-in, sign-up and setup pages. */
export function AuthPageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-950">
        <p className="text-sm font-semibold tracking-wide text-zinc-600 dark:text-zinc-400">Divido</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {children}
      </div>
    </main>
  );
}
