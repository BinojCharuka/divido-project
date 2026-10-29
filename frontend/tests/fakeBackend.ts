import { vi } from "vitest";

/**
 * An in-memory stand-in for the auth endpoints in authentication-api.md, installed
 * as `fetch`. It enforces CSRF the way the server does: a state-changing request
 * needs the current token in X-XSRF-TOKEN, and sign-in and sign-out replace it.
 */
export type Call = { method: string; path: string; headers: Record<string, string>; body: unknown; url: string };

const USER = { id: "00000000-0000-4000-8000-000000000001", onboardingComplete: false };

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function error(status: number, code: string, message: string, fieldErrors?: Record<string, string>): Response {
  return json(status, { status, code, message, ...(fieldErrors ? { fieldErrors } : {}) });
}

export function installFakeBackend() {
  const state = {
    accounts: new Map<string, { password: string }>(),
    signedInAs: null as string | null,
    csrf: null as string | null,
    issued: 0,
    calls: [] as Call[],
    /** Return this response for the next call to `path`, once. */
    overrides: new Map<string, () => Response | Promise<Response>>(),
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const path = new URL(url, "http://frontend.test").pathname;
    const method = (init.method ?? "GET").toUpperCase();
    const headers = Object.fromEntries(Object.entries((init.headers ?? {}) as Record<string, string>));
    const body = typeof init.body === "string" ? JSON.parse(init.body) : undefined;
    state.calls.push({ method, path, headers, body, url });

    const override = state.overrides.get(path);
    if (override) {
      state.overrides.delete(path);
      return override();
    }

    if (method === "GET" && path === "/api/v1/auth/csrf") {
      state.csrf ??= `raw-${++state.issued}`;
      // Masked: a different value on every response, as the real server does.
      return json(200, { headerName: "X-XSRF-TOKEN", token: `${state.csrf}.mask${Math.random()}` });
    }
    if (method === "GET" && path === "/api/v1/auth/me") {
      return state.signedInAs
        ? json(200, { user: { ...USER, email: state.signedInAs } })
        : error(401, "UNAUTHENTICATED", "Please sign in to continue.");
    }

    if (method !== "GET") {
      const sent = headers["X-XSRF-TOKEN"];
      if (!state.csrf || !sent || sent.split(".mask")[0] !== state.csrf) {
        return error(403, "CSRF_INVALID", "Your request could not be verified. Refresh the page and try again.");
      }
    }

    if (method === "POST" && path === "/api/v1/auth/register") {
      const { email, password } = body as { email: string; password: string };
      const normalized = email.toLowerCase();
      if (state.accounts.has(normalized)) {
        return error(409, "REGISTRATION_CONFLICT", "We couldn't create an account with these details.");
      }
      state.accounts.set(normalized, { password });
      return json(201, { user: { ...USER, email: normalized } });
    }
    if (method === "POST" && path === "/api/v1/auth/login") {
      const { email, password } = body as { email: string; password: string };
      const normalized = email.toLowerCase();
      if (state.accounts.get(normalized)?.password !== password) {
        return error(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
      }
      state.signedInAs = normalized;
      state.csrf = null; // replaced at sign-in
      return json(200, { user: { ...USER, email: normalized } });
    }
    if (method === "POST" && path === "/api/v1/auth/logout") {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      state.signedInAs = null;
      state.csrf = null; // cleared at sign-out
      return new Response(null, { status: 204 });
    }
    return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    state,
    fetchMock,
    callsTo: (path: string) => state.calls.filter((call) => call.path === path),
    /** Simulate the server ending the session (idle timeout or restart). */
    expireSession: () => {
      state.signedInAs = null;
    },
  };
}
