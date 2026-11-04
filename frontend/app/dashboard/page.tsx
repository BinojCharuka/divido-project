"use client";

import { Suspense } from "react";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { useMonthParam } from "@/lib/useMonthParam";

function DashboardContent() {
  const [month, setMonth] = useMonthParam();
  return <DashboardView month={month} onMonthChange={setMonth} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<p role="status">Loading dashboard…</p>}>
      <DashboardContent />
    </Suspense>
  );
}
