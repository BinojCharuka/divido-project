import { vi } from "vitest";

/**
 * Minimal scripted API for Budget/Dashboard component tests. Each route returns the
 * next queued response (or the default). Calls are recorded for assertions.
 */
export type Handler = (request: { method: string; path: string; search: URLSearchParams; body: unknown }) => Response;

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function apiError(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
  return json(status, { status, code, message, ...(fieldErrors ? { fieldErrors } : {}) });
}

export function installPhase03Backend() {
  const routes = new Map<string, Handler[]>();
  const defaults = new Map<string, Handler>();
  const calls: { method: string; path: string; search: string; body: unknown; headers: Record<string, string> }[] = [];

  const key = (method: string, path: string) => `${method} ${path}`;

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input), "http://frontend.test");
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method, path: url.pathname, search: url.search, body, headers: (init?.headers ?? {}) as Record<string, string> });
      if (method === "GET" && url.pathname === "/api/v1/auth/csrf") {
        return json(200, { headerName: "X-XSRF-TOKEN", token: "csrf-token" });
      }
      const k = key(method, url.pathname);
      const queued = routes.get(k);
      const handler = queued && queued.length > 0 ? queued.shift()! : defaults.get(k);
      if (!handler) return apiError(500, "UNHANDLED", `No handler for ${k}`);
      return handler({ method, path: url.pathname, search: url.searchParams, body });
    }),
  );

  return {
    calls,
    /** Responds to every call of this route. */
    on(method: string, path: string, handler: Handler) {
      defaults.set(key(method, path), handler);
    },
    /** Responds to the next call of this route only. */
    once(method: string, path: string, handler: Handler) {
      const k = key(method, path);
      routes.set(k, [...(routes.get(k) ?? []), handler]);
    },
  };
}
