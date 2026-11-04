"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryManager } from "@/features/categories/CategoryManager";

export default function CategoriesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Categories" subtitle="Expense categories grouped by Kakeibo: Needs, Wants, Culture and Unexpected." />
      <CategoryManager />
    </div>
  );
}
