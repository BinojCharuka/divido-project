import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, clearCsrfToken, setUnauthenticatedListener } from "@/lib/api/client";
import { installFakeBackend } from "./fakeBackend";

let backend: ReturnType<typeof installFakeBackend>;

beforeEach(() => {
  clearCsrfToken();
  setUnauthenticatedListener(null);
  backend = installFakeBackend();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function caught(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

describe("apiRequest", () => {
  it("sends cookies on every request and no CSRF header on reads", async () => {
    backend.state.signedInAs = "user@example.com";
    await apiRequest("/api/v1/auth/me");

    const [call] = backend.state.calls;
    expect(backend.fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include", cache: "no-store" });
    expect(call.headers).not.toHaveProperty("X-XSRF-TOKEN");
  });

  it("fetches a CSRF token first and sends it only in the X-XSRF-TOKEN header", async () => {
    await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: { email: "new@example.com", password: "long-enough-pw", displayName: "New" },
    });

    const [csrf, register] = backend.state.calls;
    expect(csrf).toMatchObject({ method: "GET", path: "/api/v1/auth/csrf" });
    expect(register.headers["X-XSRF-TOKEN"]).toMatch(/^raw-1\.mask/);
    expect(register.url).not.toContain("_csrf");
    expect(register.body).not.toHaveProperty("_csrf");
    expect(register.headers["Content-Type"]).toBe("application/json");
  });

  it("reuses the token until it is cleared", async () => {
    const body = { email: "a@example.com", password: "long-enough-pw", displayName: "A" };
    await apiRequest("/api/v1/auth/register", { method: "POST", body });
    await apiRequest("/api/v1/auth/register", { method: "POST", body: { ...body, email: "b@example.com" } });
    expect(backend.callsTo("/api/v1/auth/csrf")).toHaveLength(1);

    clearCsrfToken();
    await apiRequest("/api/v1/auth/register", { method: "POST", body: { ...body, email: "c@example.com" } });
    expect(backend.callsTo("/api/v1/auth/csrf")).toHaveLength(2);
  });

  it("after 403 CSRF_INVALID, fetches a new token and retries exactly once", async () => {
    const body = { email: "a@example.com", password: "long-enough-pw", displayName: "A" };
    await apiRequest("/api/v1/auth/register", { method: "POST", body });
    backend.state.csrf = "rotated-elsewhere"; // e.g. another tab signed in

    await apiRequest("/api/v1/auth/register", { method: "POST", body: { ...body, email: "b@example.com" } });

    expect(backend.callsTo("/api/v1/auth/csrf")).toHaveLength(2);
    expect(backend.callsTo("/api/v1/auth/register")).toHaveLength(3);
  });

  it("gives up after the single retry and reports CSRF_INVALID", async () => {
    const reject = () =>
      new Response(JSON.stringify({ status: 403, code: "CSRF_INVALID", message: "Your request could not be verified." }), {
        status: 403,
      });
    const realFetch = backend.fetchMock.getMockImplementation()!;
    backend.fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith("/logout")) return reject();
      return realFetch(input, init);
    });

    const error = await caught(apiRequest("/api/v1/auth/logout", { method: "POST" }));

    expect(error.kind).toBe("csrf");
    expect(backend.fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/logout"))).toHaveLength(2);
  });

  it("does not keep a token whose fetch was overtaken by a clear", async () => {
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const realFetch = backend.fetchMock.getMockImplementation()!;
    backend.fetchMock.mockImplementationOnce(async (input, init) => {
      await held;
      return realFetch(input, init);
    });
    const body = { email: "a@example.com", password: "long-enough-pw", displayName: "A" };
    const first = apiRequest("/api/v1/auth/register", { method: "POST", body });

    clearCsrfToken(); // e.g. sign-in completed elsewhere while the token was in flight
    release();
    await first;

    await apiRequest("/api/v1/auth/register", { method: "POST", body: { ...body, email: "b@example.com" } });
    expect(backend.callsTo("/api/v1/auth/csrf")).toHaveLength(2);
  });

  it("distinguishes INVALID_CREDENTIALS from UNAUTHENTICATED", async () => {
    const login = await caught(
      apiRequest("/api/v1/auth/login", { method: "POST", body: { email: "x@example.com", password: "nope" } }),
    );
    const me = await caught(apiRequest("/api/v1/auth/me"));

    expect(login).toMatchObject({ status: 401, kind: "invalid-credentials", message: "The email or password is incorrect." });
    expect(me).toMatchObject({ status: 401, kind: "unauthenticated", code: "UNAUTHENTICATED" });
  });

  it("tells the listener when a request finds the session ended, unless asked not to", async () => {
    const listener = vi.fn();
    setUnauthenticatedListener(listener);

    await caught(apiRequest("/api/v1/auth/me", { quietUnauthenticated: true }));
    expect(listener).not.toHaveBeenCalled();

    await caught(apiRequest("/api/v1/auth/me"));
    expect(listener).toHaveBeenCalledOnce();
  });

  it("does not report a failed sign-in as an ended session", async () => {
    const listener = vi.fn();
    setUnauthenticatedListener(listener);
    await caught(
      apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: { email: "x@example.com", password: "nope" },
        quietUnauthenticated: true,
      }),
    );
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps validation field errors", async () => {
    backend.state.overrides.set("/api/v1/auth/me", () =>
      Response.json(
        { status: 400, code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fieldErrors: { email: "Bad" } },
        { status: 400 },
      ),
    );
    const error = await caught(apiRequest("/api/v1/auth/me"));
    expect(error).toMatchObject({ kind: "validation", fieldErrors: { email: "Bad" } });
  });

  it("reports a network failure without a response", async () => {
    backend.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const error = await caught(apiRequest("/api/v1/auth/me"));
    expect(error).toMatchObject({ status: 0, kind: "network" });
    expect(error.message).toMatch(/couldn't reach Divido/);
  });

  it("never shows the body of a response that is not the API error envelope", async () => {
    backend.state.overrides.set(
      "/api/v1/auth/me",
      () => new Response("<html>upstream proxy-internal-host failed</html>", { status: 502 }),
    );
    const error = await caught(apiRequest("/api/v1/auth/me"));
    expect(error).toMatchObject({ status: 502, kind: "server" });
    expect(error.message).not.toContain("proxy-internal-host");
  });

  it("returns undefined for 204 No Content", async () => {
    backend.state.signedInAs = "user@example.com";
    await expect(apiRequest("/api/v1/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("never writes tokens or user data to browser storage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    backend.state.accounts.set("user@example.com", { password: "long-enough-pw" });
    await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: { email: "user@example.com", password: "long-enough-pw" },
    });
    await apiRequest("/api/v1/auth/me");
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe("");
  });
});
