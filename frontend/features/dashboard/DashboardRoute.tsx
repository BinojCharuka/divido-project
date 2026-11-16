"use client";

import { Suspense } from "react";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { useMonthParam } from "@/lib/useMonthParam";
import { DashboardPage } from "./DashboardPage";

function WithMonth() {
  const [month, setMonth] = useMonthParam();
  return <DashboardPage month={month} onMonthChange={setMonth} />;
}

/** Client entry for the route: the month lives in the URL (?month=YYYY-MM). */
export function DashboardRoute() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading dashboard…" />}>
      <WithMonth />
    </Suspense>
  );
}
