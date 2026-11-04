"use client";

import dynamic from "next/dynamic";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading Divido UI Prototype…</p>
    </div>
  ),
});

export function PrototypeLoader() {
  return (
    <>
      <p role="note" style={{ background: "#fef3c7", color: "#78350f", padding: "8px 16px", fontSize: 13, textAlign: "center" }}>
        Design prototype — sample data only. Nothing here is saved to your Divido account.
      </p>
      <FigmaApp />
    </>
  );
}
