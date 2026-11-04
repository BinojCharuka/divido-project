"use client";

import { Suspense } from "react";
import { BudgetPlanner } from "@/features/budget/BudgetPlanner";
import { useMonthParam } from "@/lib/useMonthParam";

function BudgetContent() {
  const [month, setMonth] = useMonthParam();
  return <BudgetPlanner month={month} onMonthChange={setMonth} />;
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<p role="status">Loading budget…</p>}>
      <BudgetContent />
    </Suspense>
  );
}
