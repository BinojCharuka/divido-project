"use client";

import dynamic from "next/dynamic";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => <DividoLoadingScreen message="Loading Reflection…" />,
});

export default function ReflectionPage() {
  return <FigmaApp initialPage="Monthly Reflection" />;
}
