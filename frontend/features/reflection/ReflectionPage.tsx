"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, Check, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { formatDateDisplay, formatMonthYear, getCurrentMonth } from "@/lib/formatting/dates";
import { MAX_REFLECTION_ANSWER_LENGTH, REFLECTION_QUESTIONS } from "@/types/reflection";
import { characterCount, useReflectionForm } from "./useReflectionForm";

const LIMIT = MAX_REFLECTION_ANSWER_LENGTH.toLocaleString("en");

/**
 * REFLECTION-001..004 (DIV-028). Every question is optional (BR-028). Saving sends
 * the answers to the server only; nothing is drafted (DEC-038). This page is the
 * one place that names the Kakeibo method (DEC-042).
 */
export function ReflectionPage({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const { notify } = useAppShell();
  const future = month > getCurrentMonth();
  const form = useReflectionForm(month, notify, !future);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const monthLabel = formatMonthYear(month);
  const saved = form.reflection;

  return (
    <>
      <PageHeading
        title="Monthly reflection"
        subtitle={saved ? `Saved ${formatDateDisplay(saved.updatedAt.slice(0, 10))}` : `Not written for ${monthLabel} yet`}
        actions={<MonthSelector month={month} onChange={onMonthChange} />}
      />

      {future && (
        <section className="panel empty-state">
          <CalendarDays size={36} strokeWidth={1.5} aria-hidden="true" />
          <h2>{monthLabel} hasn’t started yet</h2>
          <p>You can reflect on the current month or any earlier one.</p>
          <Button variant="primary" onClick={() => onMonthChange(getCurrentMonth())}>
            Go to this month
          </Button>
        </section>
      )}
      {form.load?.status === "loading" && <LoadingPanel label="Loading your reflection…" />}
      {form.load?.status === "error" && <InlineError message={form.load.message} onRetry={form.retry} />}
      {form.load?.status === "ready" && (
        <div className="reflection-page">
          <div className="reflection-intro">
            <h2>Looking back on {monthLabel}</h2>
            <p>
              Answer any of these questions, or none. Your answers are private to your account, and you can edit or delete
              them at any time.
            </p>
            <p className="reflection-method">
              <BookOpen size={14} aria-hidden="true" />
              Divido’s four spending groups and this monthly review are inspired by Kakeibo, a Japanese way of keeping a
              household account book.
            </p>
          </div>

          <form onSubmit={form.submit} noValidate aria-busy={form.saving}>
            {form.saveError && (
              <InlineError message={form.saveError.message} onRetry={form.saveError.conflict ? form.reloadLatest : undefined} />
            )}
            {form.fieldErrors.answers && !form.saveError && <InlineError message={form.fieldErrors.answers} />}

            {REFLECTION_QUESTIONS.map((q, i) => {
              const count = characterCount(form.answers[q.id]);
              const error = form.fieldErrors[`answers.${q.id}`];
              const over = count > MAX_REFLECTION_ANSWER_LENGTH;
              return (
                <label className="reflection-question" key={q.id} htmlFor={`reflection-${q.id}`}>
                  <span className="question-number" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <span>{q.text}</span>
                    <textarea
                      id={`reflection-${q.id}`}
                      value={form.answers[q.id]}
                      onChange={(e) => form.setAnswer(q.id, e.target.value)}
                      placeholder={q.placeholder}
                      rows={4}
                      disabled={form.saving}
                      aria-invalid={over || Boolean(error) || undefined}
                      aria-describedby={`reflection-${q.id}-count${error ? ` reflection-${q.id}-error` : ""}`}
                    />
                    <span id={`reflection-${q.id}-count`} className={`textarea-count ${over ? "over-limit" : ""}`}>
                      {count.toLocaleString("en")} / {LIMIT}
                    </span>
                    {error && (
                      <span id={`reflection-${q.id}-error`} className="field-error" role="alert">
                        {error}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}

            <div className="reflection-actions">
              {saved ? (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={form.saving}>
                  <Trash2 size={16} aria-hidden="true" />
                  Delete reflection
                </Button>
              ) : (
                <Link href="/dashboard" className="button button-ghost">
                  Skip for now
                </Link>
              )}
              <Button type="submit" variant="primary" loading={form.saving} disabled={saved !== null && form.unchanged}>
                {!form.saving && <Check size={16} aria-hidden="true" />}
                {form.saving ? "Saving…" : saved ? "Save changes" : "Save reflection"}
              </Button>
            </div>
          </form>

          {form.history.length > 0 && (
            <section className="panel reflection-history" aria-labelledby="history-heading">
              <h2 id="history-heading">Your reflections</h2>
              <ul>
                {form.history.map((h) => (
                  <li key={h.month}>
                    {h.month === month ? (
                      <span aria-current="page">{formatMonthYear(h.month)}</span>
                    ) : (
                      <button type="button" className="text-button" onClick={() => onMonthChange(h.month)}>
                        {formatMonthYear(h.month)} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}
                    <span>
                      {h.answeredCount} of {REFLECTION_QUESTIONS.length} answered
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete your ${monthLabel} reflection?`}
          confirmLabel="Delete reflection"
          pendingLabel="Deleting…"
          failureMessage="The reflection was not deleted. Please try again."
          destructive
          onConfirm={async () => {
            await form.remove();
            setConfirmDelete(false);
          }}
          onClose={() => setConfirmDelete(false)}
        >
          <p>Your answers for {monthLabel} will be permanently deleted. This can’t be undone.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
