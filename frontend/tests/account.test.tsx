import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayout from "@/app/(authenticated)/layout";
import SettingsRoute from "@/app/(authenticated)/settings/page";
import ForgotPasswordPage from "@/app/(public)/forgot-password/page";
import OnboardingPage from "@/app/(public)/onboarding/page";
import ResetPasswordPage from "@/app/(public)/reset-password/page";
import SignInPage from "@/app/(public)/sign-in/page";
import { clearCsrfToken } from "@/lib/api/client";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { getCurrentMonth } from "@/lib/formatting/dates";
import { installFakeBackend } from "./fakeBackend";

/** DIV-022 profile, DIV-023 onboarding, DIV-029 password reset, DIV-035 account deletion. */

const router = { push: vi.fn(), replace: vi.fn() };
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => searchParams,
  usePathname: () => "/settings",
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

const EMAIL = "asha@example.com";
const PASSWORD = "correct-horse-battery";
let backend: ReturnType<typeof installFakeBackend>;

beforeEach(() => {
  clearCsrfToken();
  router.push.mockReset();
  router.replace.mockReset();
  reloadTo.mockReset();
  searchParams = new URLSearchParams();
  backend = installFakeBackend();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function signedIn(account: { displayName?: string; onboardingComplete?: boolean } = {}) {
  backend.state.accounts.set(EMAIL, { password: PASSWORD, displayName: "Asha", ...account });
  backend.state.signedInAs = EMAIL;
}

function renderPage(page: ReactNode) {
  return render(<AuthProvider>{page}</AuthProvider>);
}

describe("sign-in and onboarding routing (DEC-044)", () => {
  it("sends a user who has not finished onboarding to /onboarding", async () => {
    backend.state.accounts.set(EMAIL, { password: PASSWORD, onboardingComplete: false });
    const user = userEvent.setup();
    renderPage(<SignInPage />);

    await user.type(await screen.findByRole("textbox", { name: "Email" }), EMAIL);
    await user.type(screen.getByLabelText("Password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/onboarding"));
    expect(router.replace).not.toHaveBeenCalledWith("/dashboard");
  });

  it("links to password recovery and explains the new notices", async () => {
    searchParams = new URLSearchParams("notice=account-deleted");
    renderPage(<SignInPage />);
    expect(await screen.findByText("Your account and all its data have been deleted.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
  });
});

describe("onboarding (DIV-023)", () => {
  it("saves this month's income and savings, then records completion", async () => {
    signedIn({ onboardingComplete: false });
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);

    expect(await screen.findByRole("heading", { name: "Welcome, Asha" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Get started/ }));

    await user.type(await screen.findByLabelText("Planned income"), "150000");
    await user.type(screen.getByLabelText("Savings target"), "20000");
    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    expect(await screen.findByRole("heading", { name: "You're ready" })).toBeInTheDocument();
    const month = getCurrentMonth();
    expect(backend.state.budgets.get(month)).toEqual({
      month,
      plannedIncome: "150000",
      savingsTarget: "20000",
      allocations: { NEEDS: "0.00", WANTS: "0.00", CULTURE: "0.00", UNEXPECTED: "0.00" },
    });
    expect(backend.callsTo("/api/v1/profile/onboarding-complete")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Go to dashboard" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(backend.state.accounts.get(EMAIL)?.onboardingComplete).toBe(true);
  });

  it("never overwrites a plan that already exists", async () => {
    signedIn({ onboardingComplete: false });
    const month = getCurrentMonth();
    backend.state.budgets.set(month, { month, plannedIncome: "90000.00" });
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);

    await user.click(await screen.findByRole("button", { name: /Get started/ }));
    expect(await screen.findByText(/You already have a plan/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Continue/ }));

    expect(await screen.findByRole("heading", { name: "You're ready" })).toBeInTheDocument();
    expect(backend.state.calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("can be skipped from the first step, which also counts as done", async () => {
    signedIn({ onboardingComplete: false });
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);

    await user.click(await screen.findByRole("button", { name: "Skip for now" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/dashboard"));
    expect(backend.callsTo("/api/v1/profile/onboarding-complete")).toHaveLength(1);
  });

  it("checks amounts before saving", async () => {
    signedIn({ onboardingComplete: false });
    const user = userEvent.setup();
    renderPage(<OnboardingPage />);

    await user.click(await screen.findByRole("button", { name: /Get started/ }));
    await user.click(await screen.findByRole("button", { name: "Save and continue" }));
    expect(screen.getByLabelText("Planned income")).toHaveAccessibleDescription("Enter planned income, or 0.");
    expect(backend.state.budgets.size).toBe(0);
  });
});

describe("forgot password (DIV-029)", () => {
  it("shows the same neutral reply whether or not the account exists", async () => {
    const user = userEvent.setup();
    renderPage(<ForgotPasswordPage />);

    await user.type(await screen.findByLabelText("Email address"), "  nobody@example.com ");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "If an account exists for nobody@example.com, we've sent it a link",
    );
    expect(backend.state.resetRequests).toEqual(["nobody@example.com"]);
  });

  it("asks for an email before sending", async () => {
    const user = userEvent.setup();
    renderPage(<ForgotPasswordPage />);
    await user.click(await screen.findByRole("button", { name: "Send reset link" }));
    expect(screen.getByLabelText("Email address")).toHaveAccessibleDescription("Enter your email address.");
    expect(backend.state.resetRequests).toHaveLength(0);
  });
});

describe("reset password (DIV-029)", () => {
  function openLink(token: string | null) {
    window.history.replaceState(null, "", token ? `/reset-password#token=${token}` : "/reset-password");
  }

  it("takes the token from the fragment, removes it, and sets the new password", async () => {
    backend.state.accounts.set(EMAIL, { password: PASSWORD });
    backend.state.resetTokens.set("good-token", EMAIL);
    openLink("good-token");
    const user = userEvent.setup();
    renderPage(<ResetPasswordPage />);

    const password = await screen.findByLabelText("New password");
    expect(window.location.hash).toBe("");
    await user.type(password, "a-brand-new-pass");
    await user.type(screen.getByLabelText("Confirm new password"), "a-brand-new-pass");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    await waitFor(() => expect(reloadTo).toHaveBeenCalledWith("/sign-in?notice=password-reset"));
    expect(backend.state.accounts.get(EMAIL)?.password).toBe("a-brand-new-pass");
    expect(backend.callsTo("/api/v1/auth/password-reset/confirm")[0].body).toEqual({
      token: "good-token",
      newPassword: "a-brand-new-pass",
    });
  });

  it("requires matching passwords", async () => {
    openLink("good-token");
    const user = userEvent.setup();
    renderPage(<ResetPasswordPage />);

    await user.type(await screen.findByLabelText("New password"), "a-brand-new-pass");
    await user.type(screen.getByLabelText("Confirm new password"), "something-else");
    await user.click(screen.getByRole("button", { name: "Set new password" }));
    expect(screen.getByLabelText("Confirm new password")).toHaveAccessibleDescription("The passwords don't match.");
    expect(backend.callsTo("/api/v1/auth/password-reset/confirm")).toHaveLength(0);
  });

  it("explains an expired or used link and offers a new one", async () => {
    openLink("used-token");
    const user = userEvent.setup();
    renderPage(<ResetPasswordPage />);

    await user.type(await screen.findByLabelText("New password"), "a-brand-new-pass");
    await user.type(screen.getByLabelText("Confirm new password"), "a-brand-new-pass");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("This reset link is invalid or has expired.");
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/forgot-password");
    expect(reloadTo).not.toHaveBeenCalled();
  });

  it("handles a link without a token", async () => {
    openLink(null);
    renderPage(<ResetPasswordPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("This reset link is incomplete.");
  });
});

describe("settings (DIV-022, DIV-035)", () => {
  function renderSettings() {
    return renderPage(
      <AppLayout>
        <SettingsRoute />
      </AppLayout>,
    );
  }

  it("updates the display name shown across the app", async () => {
    signedIn();
    const user = userEvent.setup();
    renderSettings();

    const field = await screen.findByLabelText("Display name");
    expect(field).toHaveValue("Asha");
    expect(screen.getByRole("button", { name: "Save name" })).toBeDisabled();
    await user.clear(field);
    await user.type(field, "  Asha Perera ");
    await user.click(screen.getByRole("button", { name: "Save name" }));

    expect(await screen.findByText("Your name has been updated.")).toBeInTheDocument();
    expect(backend.callsTo("/api/v1/profile").at(-1)?.body).toEqual({ displayName: "Asha Perera" });
    expect(screen.getByLabelText("Display name")).toHaveValue("Asha Perera");
  });

  it("changes the password only with the right current password", async () => {
    signedIn();
    const user = userEvent.setup();
    renderSettings();

    await user.click(await screen.findByText("Change password"));
    await user.type(screen.getByLabelText("Current password"), "wrong-password");
    await user.type(screen.getByLabelText("New password"), "a-brand-new-pass");
    await user.type(screen.getByLabelText("Confirm new password"), "a-brand-new-pass");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("The current password is incorrect.")).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveValue("");

    await user.type(screen.getByLabelText("Current password"), PASSWORD);
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Password changed. Other devices have been signed out.")).toBeInTheDocument();
    expect(backend.state.accounts.get(EMAIL)?.password).toBe("a-brand-new-pass");
  });

  it("deletes the account only with the password and the word DELETE", async () => {
    signedIn();
    const user = userEvent.setup();
    renderSettings();

    await user.click(await screen.findByRole("button", { name: "Delete account" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete your account?" });
    const confirm = within(dialog).getByRole("button", { name: "Delete account" });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Password"), "wrong-password");
    await user.type(within(dialog).getByLabelText("Type DELETE to confirm"), "DELETE");
    await user.click(confirm);
    expect(await within(dialog).findByText("The password is incorrect.")).toBeInTheDocument();
    expect(backend.state.accounts.has(EMAIL)).toBe(true);

    await user.type(within(dialog).getByLabelText("Password"), PASSWORD);
    await user.click(confirm);
    await waitFor(() => expect(reloadTo).toHaveBeenCalledWith("/sign-in?notice=account-deleted"));
    expect(backend.state.accounts.has(EMAIL)).toBe(false);
  });
});
