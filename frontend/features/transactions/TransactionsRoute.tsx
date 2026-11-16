"use client";

import { Suspense } from "react";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { useMonthParam } from "@/lib/useMonthParam";
import { TransactionsPage } from "./TransactionsPage";

function WithMonth() {
  const [month, setMonth] = useMonthParam();
  return <TransactionsPage month={month} onMonthChange={setMonth} />;
}

/** Client entry for the route: the month lives in the URL (?month=YYYY-MM). */
export function TransactionsRoute() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading transactions…" />}>
      <WithMonth />
    </Suspense>
  );
}
