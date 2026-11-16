"use client";

import { Suspense } from "react";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { useMonthParam } from "@/lib/useMonthParam";
import { ReflectionPage } from "./ReflectionPage";

function WithMonth() {
  const [month, setMonth] = useMonthParam();
  return <ReflectionPage month={month} onMonthChange={setMonth} />;
}

/** Client entry for the route: the month lives in the URL (?month=YYYY-MM). */
export function ReflectionRoute() {
  return (
    <Suspense fallback={<LoadingPanel label="Loading your reflection…" />}>
      <WithMonth />
    </Suspense>
  );
}
