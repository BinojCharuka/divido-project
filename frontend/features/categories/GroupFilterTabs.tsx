"use client";

import { GROUP_META, GROUP_ORDER } from "@/components/financial/groups";
import type { KakeiboGroup } from "@/types/category";

export function GroupFilterTabs({ value, onChange }: { value: KakeiboGroup | "ALL"; onChange: (v: KakeiboGroup | "ALL") => void }) {
  return (
    <div className="segmented-tabs category-tabs" role="group" aria-label="Filter by group">
      {(["ALL", ...GROUP_ORDER] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          className={value === option ? "selected" : ""}
          onClick={() => onChange(option)}
        >
          {option === "ALL" ? "All categories" : GROUP_META[option].label}
        </button>
      ))}
    </div>
  );
}
