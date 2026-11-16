import { ChartNoAxesCombined } from "lucide-react";
import { ComingLater } from "@/components/feedback/ComingLater";

/** Spending insights (DIV-027) wait for owner decisions DEC-030..033 and DEC-041. */
export function InsightsPage() {
  return (
    <ComingLater
      title="Spending insights"
      icon={ChartNoAxesCombined}
      text="Insights will describe patterns in what you record, using only your own data. Until then, the dashboard shows each group against your plan."
    />
  );
}
