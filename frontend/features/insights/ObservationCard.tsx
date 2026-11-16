import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, Repeat, TrendingDown, TrendingUp } from "lucide-react";
import { GroupBadge } from "@/components/financial/GroupBadge";
import { GROUP_META } from "@/components/financial/groups";
import type { Insights, Observation } from "@/types/insights";
import { observationCopy } from "./observationCopy";

/** The card icon, chosen from the observation; rendered directly so no component is created during render. */
function ObservationIcon({ observation }: { observation: Observation }) {
  const props = { size: 21, strokeWidth: 1.65 };
  switch (observation.type) {
    case "LARGEST_GROUP":
    case "GROUP_OVER_PLAN": {
      const GroupIcon = GROUP_ICONS[observation.group];
      return <GroupIcon {...props} />;
    }
    case "MONTH_CHANGE":
      return observation.changePercent !== null && Number(observation.changePercent) < 0 ? <TrendingDown {...props} /> : <TrendingUp {...props} />;
    case "REPEATED_CATEGORY":
      return <Repeat {...props} />;
    default:
      return <ChartNoAxesCombined {...props} />;
  }
}

const GROUP_ICONS = {
  NEEDS: GROUP_META.NEEDS.icon,
  WANTS: GROUP_META.WANTS.icon,
  CULTURE: GROUP_META.CULTURE.icon,
  UNEXPECTED: GROUP_META.UNEXPECTED.icon,
} as const;

/** One backend observation. Links to where the user can see the records behind it. */
export function ObservationCard({ observation, insights }: { observation: Observation; insights: Insights }) {
  const copy = observationCopy(observation, insights);
  const group = "group" in observation ? observation.group : null;
  const href = observation.type === "GROUP_OVER_PLAN" ? `/budget?month=${insights.month}` : `/transactions?month=${insights.month}`;

  return (
    <Link href={href} className="panel insight-card">
      <span className="group-icon" aria-hidden="true">
        <ObservationIcon observation={observation} />
      </span>
      <h3>{copy.title}</h3>
      {group && <GroupBadge group={group} />}
      <p>{copy.text}</p>
      <div className="insight-evidence">
        {copy.evidence}
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
    </Link>
  );
}
