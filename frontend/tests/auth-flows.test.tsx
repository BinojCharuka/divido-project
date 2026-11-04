import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import OnboardingPage from "@/app/onboarding/page";
import SignInPage from "@/app/sign-in/page";
import SignUpPage from "@/app/sign-up/page";
import { apiRequest, clearCsrfToken } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { installFakeBackend } from "./fakeBackend";

const router = { push: vi.fn(), replace: vi.fn() };
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
const reloadTo = vi.fn();
vi.mock("@/lib/navigation", async (original) => ({
  ...(await original<typeof import("@/lib/navigation")>()),
  reloadTo: (path: string) => reloadTo(path),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const PASSWORD = "correct-horse-battery";
let backend: ReturnType<typeof installFakeBackend>;

beforeEach(() => {
  clearCsrfToken();
  router.push.mockReset();
  router.replace.mockReset();
  reloadTo.mockReset();
  searchParams = new URLSearchParams();
  backend = installFakeBackend();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderPage(page: ReactNode) {
  return render(<AuthProvider>{page}</AuthProvider>);
}

function signedIn(email = "user@example.com") {
  backend.state.accounts.set(email, { password: PASSWORD });
  backend.state.signedInAs = email;
}

describe("session detection on start-up", () => {
  it("shows the public state when /me returns 401", async () => {
    renderPage(<SignInPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking your session…");

    expect(await screen.findByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(backend.callsTo("/api/v1/auth/me")).toHaveLength(1);
  });

  it("restores the signed-in state after a reload and leaves the public pages", async () => {
    signedIn();
    renderPage(<SignInPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("offers a retry when the API cannot be reached", async () => {
    backend.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    renderPage(<SignInPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't reach Divido");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("routes the root page by session state", async () => {
    renderPage(<HomePage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-in"));
  });
});

describe("registration", () => {
  it("creates the account and goes to sign-in without signing in (DEC-025)", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Name"), "  Sample User  ");
    await user.type(screen.getByLabelText("Email"), " New@Example.com ");
    await user.type(screen.getByLabelText("Password"), " pass with spaces ");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/sign-in?notice=registered"));
    const [request] = backend.callsTo("/api/v1/auth/register");
    expect(request.body).toEqual({ displayName: "Sample User", email: "New@Example.com", password: " pass with spaces " });
    expect(request.headers["X-XSRF-TOKEN"]).toBeTruthy();
    expect(backend.callsTo("/api/v1/auth/login")).toHaveLength(0);
    expect(backend.state.signedInAs).toBeNull();
  });

  it("checks the fields before sending and focuses the first problem", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Enter your name.");
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter a valid email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("At least 8 characters. Use at least 8 characters.");
    expect(backend.callsTo("/api/v1/auth/register")).toHaveLength(0);
  });

  it("rejects a password over 72 bytes before sending it", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Name"), "A");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "é".repeat(37)); // 37 characters, 74 bytes
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(/Use a shorter password\./);
    expect(backend.callsTo("/api/v1/auth/register")).toHaveLength(0);
  });

  it("shows the neutral conflict message and offers sign-in", async () => {
    backend.state.accounts.set("taken@example.com", { password: PASSWORD });
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Name"), "Someone");
    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("We couldn't create an account with these details.");
    expect(alert).not.toHaveTextContent("taken@example.com");
    expect(screen.getByRole("link", { name: "Sign in instead" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByLabelText("Email")).toHaveValue("taken@example.com");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("shows server field errors next to the fields", async () => {
    backend.state.overrides.set("/api/v1/auth/register", () =>
      Response.json(
        {
          status: 400,
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          fieldErrors: { displayName: "Enter a shorter name." },
        },
        { status: 400 },
      ),
    );
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Name"), "Name");
    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Please correct the highlighted fields.");
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Enter a shorter name.");
  });
});

describe("sign-in", () => {
  it("confirms the new account after registration", async () => {
    searchParams = new URLSearchParams("notice=registered");
    renderPage(<SignInPage />);
    expect(await screen.findByText("Your account has been created. Sign in to continue.")).toBeInTheDocument();
  });

  it.each([
    ["signed-out", "You have signed out."],
    ["session-ended", "Your session has ended. Sign in again to continue."],
  ])("explains notice=%s", async (notice, text) => {
    searchParams = new URLSearchParams({ notice });
    renderPage(<SignInPage />);
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it("ignores an unknown notice value", async () => {
    searchParams = new URLSearchParams("notice=<script>");
    renderPage(<SignInPage />);
    await screen.findByRole("button", { name: "Sign in" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("signs in, goes to the signed-in home and uses a fresh CSRF token afterwards", async () => {
    backend.state.accounts.set("user@example.com", { password: PASSWORD });
    const user = userEvent.setup();
    renderPage(<SignInPage />);
    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(backend.state.signedInAs).toBe("user@example.com");

    // The server replaced the token at sign-in; the next write must fetch the new one.
    await act(() => apiRequest("/api/v1/auth/logout", { method: "POST" }));
    expect(backend.callsTo("/api/v1/auth/csrf")).toHaveLength(2);
    expect(backend.callsTo("/api/v1/auth/logout")).toHaveLength(1);
    expect(backend.callsTo("/api/v1/auth/login")).toHaveLength(1);
  });

  it("shows the neutral message for wrong credentials and clears the password", async () => {
    backend.state.accounts.set("user@example.com", { password: PASSWORD });
    const user = userEvent.setup();
    renderPage(<SignInPage />);
    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is incorrect.");
    expect(screen.getByLabelText("Email")).toHaveValue("user@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    // Focus returns to the re-enabled button, not lost to the page body.
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveFocus();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("requires both fields before sending", async () => {
    const user = userEvent.setup();
    renderPage(<SignInPage />);
    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Enter your email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Enter your password.");
    expect(backend.callsTo("/api/v1/auth/login")).toHaveLength(0);
  });

  it("sends one request even when submitted twice quickly", async () => {
    backend.state.accounts.set("user@example.com", { password: PASSWORD });
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const realFetch = backend.fetchMock.getMockImplementation()!;
    backend.fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith("/login")) await held;
      return realFetch(input, init);
    });
    const user = userEvent.setup();
    renderPage(<SignInPage />);
    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const busy = await screen.findByRole("button", { name: "Signing in…" });
    expect(busy).toBeDisabled();
    await user.click(busy);
    // A submit that bypasses the disabled button (e.g. Enter in a field) is ignored too.
    fireEvent.submit(busy.closest("form")!);
    release();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(backend.callsTo("/api/v1/auth/login")).toHaveLength(1);
  });
});

describe("protected page and sign-out", () => {
  it("redirects to sign-in without a session and never shows the protected content", async () => {
    renderPage(<OnboardingPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/sign-in"));
    expect(screen.queryByText(/signed in as/)).not.toBeInTheDocument();
  });

  it("shows the signed-in user", async () => {
    signedIn();
    renderPage(<OnboardingPage />);
    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
  });

  it("signs out, clears the user and goes to sign-in", async () => {
    signedIn();
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);
    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    // A full page load, so routes kept hidden by Next.js lose their state too.
    await waitFor(() => expect(reloadTo).toHaveBeenCalledWith("/sign-in?notice=signed-out"));
    expect(backend.state.signedInAs).toBeNull();
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
    const [logout] = backend.callsTo("/api/v1/auth/logout");
    expect(logout.headers["X-XSRF-TOKEN"]).toBeTruthy();

    // The CSRF cookie was cleared at sign-out; the next write fetches a new token.
    const before = backend.callsTo("/api/v1/auth/csrf").length;
    await act(() =>
      apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: { email: "next@example.com", password: PASSWORD, displayName: "Next" },
      }),
    );
    expect(backend.callsTo("/api/v1/auth/csrf").length).toBe(before + 1);
    // Fetched up front, not discovered through a 403 and a retry.
    expect(backend.callsTo("/api/v1/auth/register")).toHaveLength(1);
  });

  it("treats sign-out of an already-ended session as signed out", async () => {
    signedIn();
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);
    const button = await screen.findByRole("button", { name: "Sign out" });
    backend.expireSession();
    await user.click(button);

    await waitFor(() => expect(reloadTo).toHaveBeenCalledWith("/sign-in?notice=signed-out"));
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
  });

  it("keeps the user signed in and explains when sign-out cannot reach the server", async () => {
    signedIn();
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);
    const button = await screen.findByRole("button", { name: "Sign out" });
    backend.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.click(button);

    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't reach Divido");
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(reloadTo).not.toHaveBeenCalled();
  });
});

describe("session expiry", () => {
  it("clears the user and reloads sign-in when a request finds the session ended", async () => {
    signedIn();
    renderPage(<OnboardingPage />);
    await screen.findByText("user@example.com");

    backend.expireSession();
    await act(async () => {
      await apiRequest("/api/v1/profile").catch(() => undefined);
    });

    expect(reloadTo).toHaveBeenCalledWith("/sign-in?notice=session-ended");
    expect(screen.queryByText("user@example.com")).not.toBeInTheDocument();
  });

  it("ignores a 401 while already signed out, so it cannot loop", async () => {
    renderPage(<SignInPage />);
    await screen.findByRole("button", { name: "Sign in" });

    await act(async () => {
      await apiRequest("/api/v1/profile").catch(() => undefined);
    });

    expect(reloadTo).not.toHaveBeenCalled();
  });
});

describe("pages kept hidden by Next.js after navigation", () => {
  it.each([
    ["sign-in", () => <SignInPage />],
    ["sign-up", () => <SignUpPage />],
  ])("do not keep a typed password on the %s page", async (_, page) => {
    // Next.js hides the previous route with <Activity mode="hidden"> instead of unmounting it.
    const user = userEvent.setup();
    const view = (mode: "visible" | "hidden") => (
      <AuthProvider>
        <Activity mode={mode}>{page()}</Activity>
      </AuthProvider>
    );
    const { rerender } = render(view("visible"));
    await user.type(await screen.findByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);

    rerender(view("hidden"));
    rerender(view("visible"));

    expect(screen.getByLabelText("Email")).toHaveValue("user@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });

  it("start the sign-up form fresh after a successful registration", async () => {
    const user = userEvent.setup();
    renderPage(<SignUpPage />);
    await user.type(await screen.findByLabelText("Name"), "Sample User");
    await user.type(screen.getByLabelText("Email"), "fresh@example.com");
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });
});
