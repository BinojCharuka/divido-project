import type { KakeiboGroup } from "@/types/category";

export interface KakeiboGroupBadgeProps {
  group: KakeiboGroup;
  size?: "sm" | "md";
  className?: string;
}

const groupConfig: Record<
  KakeiboGroup,
  { label: string; icon: string; style: string }
> = {
  NEEDS: {
    label: "Needs",
    icon: "❖", // geometric diamond symbol
    style: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  WANTS: {
    label: "Wants",
    icon: "★", // star symbol
    style: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  CULTURE: {
    label: "Culture",
    icon: "◈", // nested diamond symbol
    style: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  },
  UNEXPECTED: {
    label: "Unexpected",
    icon: "▲", // triangle alert symbol
    style: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  },
};

export function KakeiboGroupBadge({ group, size = "sm", className = "" }: KakeiboGroupBadgeProps) {
  const config = groupConfig[group] ?? {
    label: group,
    icon: "•",
    style: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200",
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-sm gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${sizeClasses} ${config.style} ${className}`}
      title={`Kakeibo group: ${config.label}`}
    >
      <span aria-hidden="true" className="text-[10px] opacity-80">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
