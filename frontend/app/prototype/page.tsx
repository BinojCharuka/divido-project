"use client";

import dynamic from "next/dynamic";
import "@/styles/figma-styles.css";
import "@/styles/design-system.css";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => <DividoLoadingScreen message="Loading Divido Prototype…" />,
});

export default function PrototypePage() {
  return <FigmaApp />;
}
