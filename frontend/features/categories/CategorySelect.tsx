"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/forms/SelectField";
import { listCategories } from "@/lib/api/categories";
import { KAKEIBO_GROUPS, type Category } from "@/types/category";

export interface CategorySelectProps {
  value: string; // selected categoryId
  onChange: (categoryId: string) => void;
  error?: string;
  className?: string;
}

export function CategorySelect({ value, onChange, error, className = "" }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const items = await listCategories();
        if (active) setCategories(items.filter((c) => c.active));
      } catch {
        if (active) setLoadError("Unable to load categories. Please refresh.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = categories.find((c) => c.id === value);
  const selectedGroupInfo = selectedCategory
    ? KAKEIBO_GROUPS.find((g) => g.id === selectedCategory.group)
    : null;

  // Group categories by Kakeibo group
  const groupedCategories = KAKEIBO_GROUPS.map((group) => ({
    group,
    categories: categories.filter((c) => c.group === group.id),
  })).filter((g) => g.categories.length > 0);

  return (
    <div className={className}>
      <SelectField
        label="Category *"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error || (loadError ?? undefined)}
        hint={
          selectedGroupInfo
            ? `Group: ${selectedGroupInfo.label} — ${selectedGroupInfo.description}`
            : undefined
        }
        disabled={loading}
      >
        <option value="">{loading ? "Loading categories…" : "Choose a category"}</option>
        {groupedCategories.map(({ group, categories }) => (
          <optgroup key={group.id} label={`${group.label} (${group.description.split(" ")[0]}…)`}>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
    </div>
  );
}
