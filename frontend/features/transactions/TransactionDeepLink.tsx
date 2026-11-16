"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppShell } from "@/components/layout/AppShellContext";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { ApiError } from "@/lib/api/client";
import { getTransaction } from "@/lib/api/transactions";
import type { TransactionType } from "@/types/transaction";

/**
 * Old deep links (/transactions/new-expense, /new-income, /{id}/edit) open the
 * matching dialog and land on the transaction list, so links and bookmarks keep working.
 */
export function TransactionDeepLink({ type, editId }: { type?: TransactionType; editId?: string }) {
  const router = useRouter();
  const { openAdd, openEdit, notify } = useAppShell();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!editId) {
      openAdd(type);
      router.replace("/transactions");
      return;
    }
    getTransaction(editId)
      .then((t) => {
        router.replace(`/transactions?month=${t.date.slice(0, 7)}`);
        openEdit(t);
      })
      .catch((err) => {
        notify(
          err instanceof ApiError && err.kind === "not-found"
            ? "That transaction no longer exists."
            : "We couldn't open that transaction. Please try again.",
        );
        router.replace("/transactions");
      });
  }, [editId, type, openAdd, openEdit, notify, router]);

  return <LoadingPanel label="Opening transaction…" />;
}
