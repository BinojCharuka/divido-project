"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";
import { ApiError } from "@/lib/api/client";

export type ApiData<T> =
  | { status: "loading"; retry: () => void }
  | { status: "error"; message: string; retry: () => void }
  | { status: "ready"; data: T; retry: () => void };

/** A user-facing message for a failed load. Server details are never shown. */
export function loadErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && (error.kind === "network" || error.kind === "rate-limited")) return error.message;
  if (error instanceof ApiError && error.kind === "validation") return error.message;
  return fallback;
}

/**
 * Loads data from the API whenever `deps` change and exposes loading / error / ready
 * states with a retry. Responses that arrive after the inputs changed are ignored.
 */
export function useApiData<T>(load: () => Promise<T>, deps: DependencyList, errorFallback: string): ApiData<T> {
  const [attempt, setAttempt] = useState(0);
  // Each result remembers the inputs it was loaded for; a result for older inputs reads as loading.
  const key = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState<
    ({ status: "error"; message: string } | { status: "ready"; data: T }) & { key: string }
  >();
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult({ key, status: "ready", data }))
      .catch((error) => active && setResult({ key, status: "error", message: loadErrorMessage(error, errorFallback) }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures the caller's inputs to `load`
  }, [key]);

  if (!result || result.key !== key) return { status: "loading", retry };
  return { ...result, retry } as ApiData<T>;
}
