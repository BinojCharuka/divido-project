/**
 * The one place that calls the Divido API. It sends the session cookie, adds the
 * CSRF header to state-changing requests and turns failures into ApiError.
 * See docs/05-api/authentication-api.md, "Frontend integration".
 */

/** Empty means the API is served from the same origin as the frontend. */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

const CSRF_HEADER = "X-XSRF-TOKEN";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type ApiErrorKind =
  | "network"
  | "validation"
  | "unauthenticated"
  | "invalid-credentials"
  | "csrf"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "rate-limited"
  | "server"
  | "unknown";

/** A failed API call: an HTTP error envelope, or no response at all (status 0). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly kind: ApiErrorKind;
  readonly fieldErrors: Readonly<Record<string, string>>;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.kind = kindOf(status, code);
    this.fieldErrors = fieldErrors;
  }
}

const NETWORK_MESSAGE = "We couldn't reach Divido. Check your connection and try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again.";

function kindOf(status: number, code: string): ApiErrorKind {
  if (status === 0) return "network";
  if (code === "INVALID_CREDENTIALS") return "invalid-credentials";
  if (code === "CSRF_INVALID") return "csrf";
  if (status === 400) return "validation";
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate-limited";
  if (status >= 500) return "server";
  return "unknown";
}

// The masked CSRF token lives only in memory: never in storage, never read from a cookie.
let csrfToken: string | null = null;
let pendingCsrf: Promise<string> | null = null;
// Bumped on every clear, so a fetch that started before the clear cannot store its token.
let csrfGeneration = 0;

/** Forget the token, e.g. after sign-in or sign-out, when the server replaces it. */
export function clearCsrfToken(): void {
  csrfToken = null;
  pendingCsrf = null;
  csrfGeneration++;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  if (!pendingCsrf) {
    const generation = csrfGeneration;
    const request = send<{ token: string }>("/api/v1/auth/csrf", { method: "GET" })
      .then((body) => {
        if (generation === csrfGeneration) csrfToken = body.token;
        return body.token;
      })
      .finally(() => {
        if (pendingCsrf === request) pendingCsrf = null;
      });
    pendingCsrf = request;
  }
  return pendingCsrf;
}

type UnauthenticatedListener = () => void;
let onUnauthenticated: UnauthenticatedListener | null = null;

/** Called when any request reports that the session has ended. */
export function setUnauthenticatedListener(listener: UnauthenticatedListener | null): void {
  onUnauthenticated = listener;
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Do not report a 401 to the listener (sign-in failures, the initial session check). */
  quietUnauthenticated?: boolean;
};

/**
 * Sends a request and returns the parsed JSON body (undefined for 204).
 * State-changing requests carry the CSRF token; after a 403 CSRF_INVALID the token
 * is fetched again and the request is retried once.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  try {
    if (SAFE_METHODS.has(method)) {
      return await send<T>(path, options);
    }
    try {
      return await send<T>(path, options, await getCsrfToken());
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== "csrf") throw error;
      clearCsrfToken();
      return await send<T>(path, options, await getCsrfToken());
    }
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthenticated" && !options.quietUnauthenticated) {
      onUnauthenticated?.();
    }
    throw error;
  }
}

async function send<T>(path: string, options: RequestOptions, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers[CSRF_HEADER] = token;

  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_MESSAGE);
  }

  if (response.status === 204) return undefined as T;
  const body = await readJson(response);
  if (response.ok) return body as T;
  throw toApiError(response.status, body);
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const { code, message, fieldErrors } = body as Record<string, unknown>;
    if (typeof code === "string" && typeof message === "string") {
      return new ApiError(status, code, message, isStringRecord(fieldErrors) ? fieldErrors : {});
    }
  }
  // No usable envelope (for example a proxy error page): never show its contents.
  return new ApiError(status, "UNKNOWN_ERROR", SERVER_MESSAGE);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    !!value &&
    typeof value === "object" &&
    Object.values(value as Record<string, unknown>).every((v) => typeof v === "string")
  );
}
