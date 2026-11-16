/**
 * Monthly reflection model matching docs/05-api/reflections-api.md (DIV-028;
 * DEC-034, DEC-035, DEC-038, DEC-039, DEC-040).
 */

export type ReflectionQuestionId = "what-went-well" | "what-felt-difficult" | "what-to-change";

export interface ReflectionAnswer {
  questionId: string;
  answer: string;
}

export interface Reflection {
  month: string;
  questionSetVersion: number;
  /** Send back on the next save; a stale value is rejected with 409 REFLECTION_CONFLICT. */
  version: number;
  answers: ReflectionAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionInput {
  /** Omitted for the first save of a month. */
  version?: number;
  answers: ReflectionAnswer[];
}

export interface ReflectionSummary {
  month: string;
  answeredCount: number;
  updatedAt: string;
}

/** DEC-034 question set version 1, in display order. */
export const REFLECTION_QUESTIONS: { id: ReflectionQuestionId; text: string; placeholder: string }[] = [
  { id: "what-went-well", text: "What went well with your money this month?", placeholder: "Something you felt good about…" },
  { id: "what-felt-difficult", text: "What felt difficult or surprising?", placeholder: "An expense or moment that stood out…" },
  { id: "what-to-change", text: "What would you like to change next month?", placeholder: "One thing you’d like to try…" },
];

/** DEC-035, counted in characters (code points), as the server counts them. */
export const MAX_REFLECTION_ANSWER_LENGTH = 2000;
