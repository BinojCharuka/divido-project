"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { IncomeSourceManager } from "@/features/income-sources/IncomeSourceManager";

export default function IncomeSourcesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Income sources" subtitle="Optional labels for where your income comes from." />
      <IncomeSourceManager />
    </div>
  );
}
