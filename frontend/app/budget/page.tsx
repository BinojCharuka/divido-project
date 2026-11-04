"use client";

import dynamic from "next/dynamic";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => <DividoLoadingScreen message="Loading Budget…" />,
});

export default function BudgetPage() {
  return <FigmaApp initialPage="Budget" />;
}
