"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cleanNumberString } from "@/lib/formatting/money";

type Mode = "expense" | "income";

const labels = {
  expense: { title: "Add expense", action: "Save expense", relation: "Category", guidance: "Categories will appear here when they are available." },
  income: { title: "Add income", action: "Save income", relation: "Income source", guidance: "Income sources will appear here when they are available." },
} satisfies Record<Mode, { title: string; action: string; relation: string; guidance: string }>;

/** Form layout and client-side affordances only; no transaction request is sent until TX-002 is approved. */
export function TransactionForm({ mode }: { mode: Mode }) {
  const copy = labels[mode];
  const amountId = useId();
  const relationId = useId();
  const dateId = useId();
  const descriptionId = useId();
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function showIntegrationNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Saving will be enabled after the transaction API contract and required fields are approved.");
  }

  return (
    <div className="mx-auto max-w-2xl pb-20 sm:pb-0">
      <Link href="/transactions" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary-strong)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
        ← Back to transactions
      </Link>
      <div className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-[var(--primary-strong)]">Transactions</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Add the essentials now; optional details are clearly separated.</p>

        <form className="mt-8 space-y-5" onSubmit={showIntegrationNotice} noValidate>
          <div>
            <label htmlFor={amountId} className="text-sm font-semibold">Amount <span className="text-[#a64035]">*</span></label>
            <div className="mt-2 flex overflow-hidden rounded-xl border border-[var(--border)] bg-white focus-within:ring-2 focus-within:ring-[var(--focus)]">
              <input
                id={amountId}
                value={amount}
                onChange={(event) =>
                  setAmount(cleanNumberString(event.target.value))
                }
                onFocus={(event) => event.target.select()}
                inputMode="decimal"
                placeholder="0.00"
                className="min-h-12 min-w-0 flex-1 px-4 outline-none"
                aria-describedby={`${amountId}-hint`}
              />
              <span className="m-1 grid min-w-13 place-items-center rounded-lg bg-[var(--surface-muted)] px-3 text-sm font-semibold text-[var(--text-secondary)]">LKR</span>
            </div>
            <p id={`${amountId}-hint`} className="mt-2 text-sm text-[var(--text-secondary)]">Enter the amount exactly as it appears on your receipt or record.</p>
          </div>

          <div>
            <label htmlFor={relationId} className="text-sm font-semibold">{copy.relation} <span className="text-[#a64035]">*</span></label>
            <select id={relationId} disabled className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--text-secondary)] disabled:cursor-not-allowed">
              <option>{copy.guidance}</option>
            </select>
            <p className="mt-2 rounded-xl bg-[#eef4ee] px-3 py-2 text-sm text-[#315b45]">{mode === "expense" ? "A category group will explain how this expense is classified." : "Sources will help distinguish actual income records."}</p>
          </div>

          <div>
            <label htmlFor={dateId} className="text-sm font-semibold">Date <span className="text-[#a64035]">*</span></label>
            <input id={dateId} type="date" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" />
          </div>

          <div>
            <label htmlFor={descriptionId} className="text-sm font-semibold">Description <span className="font-normal text-[var(--text-secondary)]">(optional)</span></label>
            <textarea id={descriptionId} rows={3} placeholder={mode === "expense" ? "e.g. Weekly groceries" : "e.g. Monthly salary"} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" />
          </div>

          {mode === "expense" && <div><label className="text-sm font-semibold">Payment method <span className="font-normal text-[var(--text-secondary)]">(optional)</span></label><select disabled className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--text-secondary)] disabled:cursor-not-allowed"><option>Available payment methods will appear here.</option></select></div>}

          {notice && <p role="status" className="rounded-xl border border-[#b5cfba] bg-[#eef4ee] px-4 py-3 text-sm text-[#315b45]">{notice}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link href="/transactions" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--primary-strong)] outline-none hover:bg-[#e7f0e9] focus-visible:ring-2 focus-visible:ring-[var(--focus)]">Cancel</Link>
            <Button type="submit">{copy.action}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
