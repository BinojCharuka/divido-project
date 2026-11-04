"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { IncomeForm } from "@/features/transactions/IncomeForm";

export default function NewIncomePage() {
  return (
    <div>
      <PageHeader
        title="Record Income"
        subtitle="Log actual income received to track against your planned budget."
        backHref="/transactions"
      />
      <IncomeForm />
    </div>
  );
}
