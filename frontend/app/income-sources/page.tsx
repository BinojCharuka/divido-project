"use client";

import dynamic from "next/dynamic";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => <DividoLoadingScreen message="Loading Income Sources…" />,
});

export default function IncomeSourcesPage() {
  return <FigmaApp initialPage="Income Sources" />;
}
