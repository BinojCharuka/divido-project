"use client";

import { useEffect, useState } from "react";
import { SelectField } from "@/components/forms/SelectField";
import { listIncomeSources } from "@/lib/api/income-sources";
import type { IncomeSource } from "@/types/income-source";

export interface IncomeSourceSelectProps {
  value: string; // selected incomeSourceId
  onChange: (sourceId: string) => void;
  error?: string;
  className?: string;
}

export function IncomeSourceSelect({ value, onChange, error, className = "" }: IncomeSourceSelectProps) {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const items = await listIncomeSources();
        if (active) setSources(items.filter((s) => s.active));
      } catch {
        if (active) setLoadError("Unable to load income sources.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={className}>
      <SelectField
        label="Income Source (optional)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error || (loadError ?? undefined)}
        hint="Identify the origin (e.g. Salary, Freelance, Rental)"
        disabled={loading}
      >
        <option value="">{loading ? "Loading sources…" : "Select source (optional)"}</option>
        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
