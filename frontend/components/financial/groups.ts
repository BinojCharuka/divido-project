import { BookOpen, Heart, House, Wrench, type LucideIcon } from "lucide-react";
import type { KakeiboGroup } from "@/types/category";

/** Display order and presentation of the four spending groups (DEC-004). */
export const GROUP_ORDER: KakeiboGroup[] = ["NEEDS", "WANTS", "CULTURE", "UNEXPECTED"];

export const GROUP_META: Record<KakeiboGroup, { label: string; icon: LucideIcon; description: string }> = {
  NEEDS: { label: "Needs", icon: House, description: "Everyday essentials and living costs" },
  WANTS: { label: "Wants", icon: Heart, description: "Dining out, entertainment, and hobbies" },
  CULTURE: { label: "Culture", icon: BookOpen, description: "Books, education, and personal growth" },
  UNEXPECTED: { label: "Unexpected", icon: Wrench, description: "Unplanned expenses and emergencies" },
};

/** CSS modifier for a group's accent colour, e.g. "pillar-needs". */
export function pillarClass(group: KakeiboGroup): string {
  return `pillar-${GROUP_META[group].label.toLowerCase()}`;
}
