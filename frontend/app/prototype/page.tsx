"use client";

import dynamic from "next/dynamic";
import "@/styles/figma-styles.css";
import "@/styles/design-system.css";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading Divido UI Prototype…</p>
    </div>
  ),
});

export default function PrototypePage() {
  return <FigmaApp />;
}
