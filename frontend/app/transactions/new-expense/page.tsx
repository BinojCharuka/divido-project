"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseForm } from "@/features/transactions/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div>
      <PageHeader
        title="Record Expense"
        subtitle="Log spending and assign it to an approved category."
        backHref="/transactions"
      />
      <ExpenseForm />
    </div>
  );
}
