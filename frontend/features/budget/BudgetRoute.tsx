"use client";

import { Suspense } from "react";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { useMonthParam } from "@/lib/useMonthParam";
import { BudgetPage } from "./BudgetPage";

function WithMonth() {
  const [month, setMonth] = useMonthParam();
  return <BudgetPage month={month} onMonthChange={setMonth} />;
}

/** Client entry for the route: the month lives in the URL (?month=YYYY-MM). */
export function BudgetRoute() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading your plan…" />}>
      <WithMonth />
    </Suspense>
  );
}
