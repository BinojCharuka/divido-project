"use client";

import { Suspense } from "react";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { useMonthParam } from "@/lib/useMonthParam";
import { InsightsPage } from "./InsightsPage";

function WithMonth() {
  const [month, setMonth] = useMonthParam();
  return <InsightsPage month={month} onMonthChange={setMonth} />;
}

/** Client entry for the route: the month lives in the URL (?month=YYYY-MM). */
export function InsightsRoute() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading insights…" />}>
      <WithMonth />
    </Suspense>
  );
}
