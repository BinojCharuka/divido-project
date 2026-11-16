"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { deleteReflection, getReflection, listReflections, saveReflection } from "@/lib/api/reflections";
import { useApiData } from "@/lib/useApiData";
import {
  MAX_REFLECTION_ANSWER_LENGTH,
  REFLECTION_QUESTIONS,
  type Reflection,
  type ReflectionQuestionId,
  type ReflectionSummary,
} from "@/types/reflection";

type Answers = Record<ReflectionQuestionId, string>;

const EMPTY: Answers = { "what-went-well": "", "what-felt-difficult": "", "what-to-change": "" };

/** Characters as the server counts them (code points), so emoji count once. */
export function characterCount(text: string): number {
  return Array.from(text.trim()).length;
}

function answersOf(reflection: Reflection | null): Answers {
  const answers = { ...EMPTY };
  for (const a of reflection?.answers ?? []) {
    if (a.questionId in answers) answers[a.questionId as ReflectionQuestionId] = a.answer;
  }
  return answers;
}

/** What to say when saving fails. The text always stays in the form. */
function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "conflict") {
      return "This reflection was changed in another tab or on another device, so your edit was not saved. Your text is still here: copy anything you want to keep, then load the latest version.";
    }
    if (error.kind === "validation") {
      return error.fieldErrors.month ?? error.fieldErrors.answers ?? "Your reflection was not saved. Please check the highlighted answers.";
    }
    if (error.kind === "unauthenticated") return "Your session has ended. Sign in again to save this reflection.";
    if (error.kind === "network") return `Your reflection was not saved. ${error.message}`;
  }
  return "Your reflection was not saved because something went wrong. Your text is kept; please try again.";
}

/**
 * State for REFLECTION-001/002/004. Nothing is kept as a draft, in the browser or on
 * the server (DEC-038); a save sends the version last read (DEC-039).
 */
export function useReflectionForm(month: string, notify: (message: string) => void, enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const load = useApiData<{ reflection: Reflection | null; history: ReflectionSummary[] } | null>(
    async () => {
      if (!enabled) return null;
      const [reflection, history] = await Promise.all([getReflection(month), listReflections()]);
      return { reflection, history };
    },
    [month, enabled, attempt],
    "We couldn't load your reflection. Check your connection and try again.",
  );

  const loaded = load.status === "ready" ? load.data : null;
  const [saved, setSaved] = useState<{ key: string; reflection: Reflection | null } | null>(null);
  const key = `${month}:${attempt}`;
  // A save or delete in this view replaces what was loaded for the same month.
  const reflection = saved && saved.key === key ? saved.reflection : (loaded?.reflection ?? null);

  const [values, setValues] = useState<{ key: string; answers: Answers } | null>(null);
  const baseline = useMemo(() => answersOf(reflection), [reflection]);
  const answers = values && values.key === key ? values.answers : baseline;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<{ key: string; message: string; conflict: boolean } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ key: string; errors: Record<string, string> } | null>(null);

  const unchanged = REFLECTION_QUESTIONS.every((q) => answers[q.id].trim() === baseline[q.id].trim());
  const tooLong = REFLECTION_QUESTIONS.filter((q) => characterCount(answers[q.id]) > MAX_REFLECTION_ANSWER_LENGTH).map((q) => q.id);
  const allBlank = REFLECTION_QUESTIONS.every((q) => answers[q.id].trim() === "");

  // Unsaved text is lost when the tab closes (no drafts), so warn first.
  useEffect(() => {
    if (unchanged) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unchanged]);

  function setAnswer(id: ReflectionQuestionId, text: string) {
    setValues({ key, answers: { ...answers, [id]: text } });
  }

  function reloadLatest() {
    setValues(null);
    setSaved(null);
    setSaveError(null);
    setFieldErrors(null);
    setAttempt((n) => n + 1);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const local: Record<string, string> = {};
    for (const id of tooLong) local[`answers.${id}`] = `Answers can be at most ${MAX_REFLECTION_ANSWER_LENGTH.toLocaleString("en")} characters.`;
    if (allBlank) local.answers = reflection ? "To remove every answer, delete the reflection instead." : "Write an answer to at least one question before saving.";
    if (Object.keys(local).length > 0) {
      setFieldErrors({ key, errors: local });
      setSaveError(null);
      return;
    }

    setSaving(true);
    setSaveError(null);
    setFieldErrors(null);
    try {
      const stored = await saveReflection(month, {
        ...(reflection ? { version: reflection.version } : {}),
        answers: REFLECTION_QUESTIONS.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
      });
      setSaved({ key, reflection: stored });
      setValues(null);
      notify(reflection ? "Reflection updated" : "Reflection saved");
    } catch (error) {
      const conflict = error instanceof ApiError && error.kind === "conflict";
      setSaveError({ key, message: saveErrorMessage(error), conflict });
      if (error instanceof ApiError && error.kind === "validation") setFieldErrors({ key, errors: { ...error.fieldErrors } });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await deleteReflection(month);
    setSaved({ key, reflection: null });
    setValues(null);
    notify("Reflection deleted");
  }

  // The list was loaded with the page; reflect this view's own save or delete in it.
  const others = (loaded?.history ?? []).filter((h) => h.month !== month);
  const history: ReflectionSummary[] = reflection
    ? [{ month, answeredCount: reflection.answers.length, updatedAt: reflection.updatedAt }, ...others].sort((a, b) =>
        b.month.localeCompare(a.month),
      )
    : others;

  return {
    load: enabled ? load : null,
    reflection,
    history,
    answers,
    setAnswer,
    unchanged,
    saving,
    saveError: saveError && saveError.key === key ? saveError : null,
    fieldErrors: fieldErrors && fieldErrors.key === key ? fieldErrors.errors : {},
    submit,
    remove,
    reloadLatest,
    retry: load.retry,
  };
}
