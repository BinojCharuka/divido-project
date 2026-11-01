"use client";

import dynamic from "next/dynamic";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading Expense Categories…</p>
    </div>
  ),
});

export default function CategoriesPage() {
  return <FigmaApp initialPage="Expense Categories" />;
}
