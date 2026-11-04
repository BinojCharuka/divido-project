"use client";

import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionPageShell } from "@/components/layout/TransactionPageShell";

/**
 * Honest placeholder for signed-in routes whose feature is planned for a later
 * phase (budget, dashboard, insights, reflection, settings). It never shows
 * sample or locally stored figures as if they were the user's financial records.
 */
export function NotYetAvailablePage({ title, phase }: { title: string; phase: string }) {
  return (
    <TransactionPageShell>
      <PageHeader title={title} />
      <EmptyState
        title={`${title} is not available yet`}
        description={`This part of Divido is planned for ${phase}. Your recorded transactions are available now.`}
        action={{ href: "/transactions", label: "Go to Transactions" }}
      />
    </TransactionPageShell>
  );
}
