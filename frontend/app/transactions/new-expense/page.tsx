"use client";

<<<<<<< HEAD
import dynamic from "next/dynamic";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading…</p>
    </div>
  ),
});
=======
export const instant = false;

import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseForm } from "@/features/transactions/ExpenseForm";
>>>>>>> 0112277 (feat: export instant equals false in transaction pages and layout)

export default function NewExpensePage() {
  return <FigmaApp initialPage="Transactions" />;
}
