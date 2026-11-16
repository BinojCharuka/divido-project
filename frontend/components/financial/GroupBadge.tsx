import type { KakeiboGroup } from "@/types/category";
import { GROUP_META, pillarClass } from "./groups";

export function GroupBadge({ group }: { group: KakeiboGroup }) {
  const { label, icon: Icon } = GROUP_META[group];
  return (
    <span className={`group-badge ${pillarClass(group)}`}>
      <Icon size={11} strokeWidth={2.2} aria-hidden="true" />
      {label}
    </span>
  );
}
