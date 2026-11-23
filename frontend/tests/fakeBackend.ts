import { vi } from "vitest";
import type { Transaction } from "@/types/transaction";

/**
 * An in-memory stand-in for the auth endpoints in authentication-api.md, installed
 * as `fetch`. It enforces CSRF the way the server does: a state-changing request
 * needs the current token in X-XSRF-TOKEN, and sign-in and sign-out replace it.
 */
export type Call = { method: string; path: string; headers: Record<string, string>; body: unknown; url: string };

const USER_ID = "00000000-0000-4000-8000-000000000001";

export type FakeAccount = { password: string; displayName?: string; onboardingComplete?: boolean };

/** The `user` object for an account; existing accounts have finished onboarding unless a test says not. */
function userFor(email: string, account: FakeAccount | undefined) {
  return {
    id: USER_ID,
    email,
    displayName: account?.displayName ?? email.split("@")[0],
    onboardingComplete: account?.onboardingComplete ?? true,
  };
}

function profileFor(email: string, account: FakeAccount | undefined) {
  return { ...userFor(email, account), currency: "LKR", timeZone: "Asia/Colombo", locale: "en" };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function error(status: number, code: string, message: string, fieldErrors?: Record<string, string>): Response {
  return json(status, { status, code, message, ...(fieldErrors ? { fieldErrors } : {}) });
}

export interface FakeCategory {
  id: string;
  name: string;
  group: "NEEDS" | "WANTS" | "CULTURE" | "UNEXPECTED";
  isDefault?: boolean;
  active?: boolean;
}

export interface FakeIncomeSource {
  id: string;
  name: string;
  active?: boolean;
}

export const DEFAULT_CATEGORIES: FakeCategory[] = [
  { id: "cat-1", name: "Groceries", group: "NEEDS", isDefault: true, active: true },
  { id: "cat-2", name: "Transport", group: "NEEDS", isDefault: true, active: true },
  { id: "cat-3", name: "Entertainment", group: "WANTS", isDefault: true, active: true },
];

export const DEFAULT_INCOME_SOURCES: FakeIncomeSource[] = [
  { id: "src-1", name: "Monthly Salary", active: true },
  { id: "src-2", name: "Freelance", active: true },
  { id: "src-3", name: "Investments", active: true },
];

function resolveCategory(id: string, customCategories: FakeCategory[] = []) {
  const all = [...DEFAULT_CATEGORIES, ...customCategories];
  const found = all.find((c) => c.id === id);
  if (found) {
    return { id: found.id, name: found.name, group: found.group };
  }
  return { id, name: "Selected Category", group: "NEEDS" as const };
}

function resolveIncomeSource(id: string, customIncomeSources: FakeIncomeSource[] = []) {
  const all = [...DEFAULT_INCOME_SOURCES, ...customIncomeSources];
  const found = all.find((s) => s.id === id);
  if (found) {
    return { id: found.id, name: found.name };
  }
  return { id, name: "Income Source" };
}

export function installFakeBackend() {
  const state = {
    accounts: new Map<string, FakeAccount>(),
    budgets: new Map<string, unknown>(),
    /** Reset tokens that still work, mapped to the account email. */
    resetTokens: new Map<string, string>(),
    resetRequests: [] as string[],
    signedInAs: null as string | null,
    csrf: null as string | null,
    issued: 0,
    calls: [] as Call[],
    transactions: new Map<string, Transaction>(),
    customCategories: [] as FakeCategory[],
    customIncomeSources: [] as FakeIncomeSource[],
    /** Per-install copies, so a test that deactivates one does not leak into the next. */
    baseIncomeSources: DEFAULT_INCOME_SOURCES.map((source) => ({ ...source })),
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
        ? json(200, { user: userFor(state.signedInAs, state.accounts.get(state.signedInAs)) })
        : error(401, "UNAUTHENTICATED", "Please sign in to continue.");
    }

    if (method !== "GET") {
      const sent = headers["X-XSRF-TOKEN"];
      if (!state.csrf || !sent || sent.split(".mask")[0] !== state.csrf) {
        return error(403, "CSRF_INVALID", "Your request could not be verified. Refresh the page and try again.");
      }
    }

    if (method === "POST" && path === "/api/v1/auth/register") {
      const { email, password, displayName } = body as { email: string; password: string; displayName: string };
      const normalized = email.toLowerCase();
      if (state.accounts.has(normalized)) {
        return error(409, "REGISTRATION_CONFLICT", "We couldn't create an account with these details.");
      }
      const account = { password, displayName, onboardingComplete: false };
      state.accounts.set(normalized, account);
      return json(201, { user: userFor(normalized, account) });
    }
    if (method === "POST" && path === "/api/v1/auth/login") {
      const { email, password } = body as { email: string; password: string };
      const normalized = email.toLowerCase();
      if (state.accounts.get(normalized)?.password !== password) {
        return error(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
      }
      state.signedInAs = normalized;
      state.csrf = null; // replaced at sign-in
      return json(200, { user: userFor(normalized, state.accounts.get(normalized)) });
    }
    if (method === "POST" && path === "/api/v1/auth/logout") {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      state.signedInAs = null;
      state.csrf = null; // cleared at sign-out
      return new Response(null, { status: 204 });
    }

    // Password reset (AUTH-007/008): neutral reply, single-use tokens.
    if (method === "POST" && path === "/api/v1/auth/password-reset/request") {
      const email = String((body as { email: string }).email).trim().toLowerCase();
      state.resetRequests.push(email);
      if (state.accounts.has(email)) state.resetTokens.set(`token-for-${email}`, email);
      return new Response(null, { status: 202 });
    }
    if (method === "POST" && path === "/api/v1/auth/password-reset/confirm") {
      const { token, newPassword } = body as { token: string; newPassword: string };
      const email = state.resetTokens.get(token);
      if (!email) {
        return error(400, "PASSWORD_RESET_INVALID", "This reset link is invalid or has expired. Request a new one.");
      }
      state.resetTokens.delete(token);
      state.accounts.get(email)!.password = newPassword;
      if (state.signedInAs === email) state.signedInAs = null;
      return new Response(null, { status: 204 });
    }

    // Profile (PROFILE-001..005)
    if (path === "/api/v1/profile" || path.startsWith("/api/v1/profile/")) {
      const email = state.signedInAs;
      const account = email ? state.accounts.get(email) : undefined;
      if (!email || !account) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      if (method === "GET" && path === "/api/v1/profile") return json(200, profileFor(email, account));
      if (method === "PATCH" && path === "/api/v1/profile") {
        account.displayName = String((body as { displayName: string }).displayName).trim();
        return json(200, profileFor(email, account));
      }
      if (method === "POST" && path === "/api/v1/profile/onboarding-complete") {
        account.onboardingComplete = true;
        return json(200, profileFor(email, account));
      }
      if (method === "POST" && path === "/api/v1/profile/password") {
        const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };
        if (currentPassword !== account.password) {
          return error(400, "VALIDATION_ERROR", "Some fields are invalid.", {
            currentPassword: "The current password is incorrect.",
          });
        }
        account.password = newPassword;
        return new Response(null, { status: 204 });
      }
      if (method === "DELETE" && path === "/api/v1/profile") {
        const { password, confirmation } = body as { password: string; confirmation: string };
        if (confirmation !== "DELETE") {
          return error(400, "VALIDATION_ERROR", "Some fields are invalid.", { confirmation: "Type DELETE to confirm." });
        }
        if (password !== account.password) {
          return error(400, "VALIDATION_ERROR", "Some fields are invalid.", { password: "The password is incorrect." });
        }
        state.accounts.delete(email);
        state.signedInAs = null;
        state.csrf = null;
        return new Response(null, { status: 204 });
      }
    }

    // Budgets, as far as onboarding uses them (BUDGET-001/002)
    const budgetMatch = path.match(/^\/api\/v1\/budgets\/(\d{4}-\d{2})$/);
    if (budgetMatch) {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      const month = budgetMatch[1];
      if (method === "GET") {
        const stored = state.budgets.get(month);
        return stored ? json(200, stored) : error(404, "BUDGET_NOT_FOUND", "No budget for this month.");
      }
      if (method === "PUT") {
        const stored = { month, ...(body as object) };
        state.budgets.set(month, stored);
        return json(200, stored);
      }
    }

    const searchParams = new URL(url, "http://frontend.test").searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Categories (DEC-013: exactly 3 global default categories, immutable)
    if (path === "/api/v1/categories" || path.startsWith("/api/v1/categories/")) {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      const all = [...DEFAULT_CATEGORIES, ...state.customCategories];
      if (method === "GET" && path === "/api/v1/categories") {
        return json(200, { items: all.filter((c) => includeInactive || c.active !== false) });
      }
      if (method === "POST" && path === "/api/v1/categories") {
        const { name, group } = body as { name: string; group: FakeCategory["group"] };
        if (all.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
          return error(409, "CONFLICT", `A category named '${name.trim()}' already exists.`);
        }
        const created = { id: `cat-c${state.customCategories.length + 1}`, name: name.trim(), group, isDefault: false, active: true };
        state.customCategories.push(created);
        return json(201, created);
      }
      const match = path.match(/^\/api\/v1\/categories\/([^/]+)(\/deactivate)?$/);
      if (match) {
        const [, id, deactivate] = match;
        if (DEFAULT_CATEGORIES.some((c) => c.id === id)) {
          return error(403, "FORBIDDEN", "Global default categories cannot be modified.");
        }
        const target = state.customCategories.find((c) => c.id === id);
        if (!target) return error(404, "NOT_FOUND", "Category not found.");
        if (method === "POST" && deactivate) {
          target.active = false;
          return new Response(null, { status: 204 });
        }
        if (method === "PATCH" && !deactivate) {
          const changes = body as Partial<FakeCategory>;
          if (changes.name !== undefined) target.name = changes.name;
          if (changes.group !== undefined) target.group = changes.group;
          return json(200, target);
        }
      }
    }

    // Income sources (always user-owned)
    if (path === "/api/v1/income-sources" || path.startsWith("/api/v1/income-sources/")) {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      const all = [...state.baseIncomeSources, ...state.customIncomeSources];
      if (method === "GET" && path === "/api/v1/income-sources") {
        return json(200, { items: all.filter((s) => includeInactive || s.active !== false) });
      }
      if (method === "POST" && path === "/api/v1/income-sources") {
        const { name } = body as { name: string };
        if (all.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) {
          return error(409, "CONFLICT", `An income source named '${name.trim()}' already exists.`);
        }
        const created = { id: `src-c${state.customIncomeSources.length + 1}`, name: name.trim(), active: true };
        state.customIncomeSources.push(created);
        return json(201, created);
      }
      const match = path.match(/^\/api\/v1\/income-sources\/([^/]+)(\/deactivate)?$/);
      if (match) {
        const [, id, deactivate] = match;
        const target = all.find((s) => s.id === id);
        if (!target) return error(404, "NOT_FOUND", "Income source not found.");
        if (method === "POST" && deactivate) {
          target.active = false;
          return new Response(null, { status: 204 });
        }
        if (method === "PATCH" && !deactivate) {
          target.name = (body as { name: string }).name;
          return json(200, target);
        }
      }
    }

    // Transactions list & create
    if (path === "/api/v1/transactions") {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");

      if (method === "GET") {
        const typeFilter = searchParams.get("type");
        const categoryFilter = searchParams.get("categoryId");
        const sourceFilter = searchParams.get("incomeSourceId");
        let items = Array.from(state.transactions.values());
        if (typeFilter) items = items.filter((tx) => tx.type === typeFilter);
        if (categoryFilter) items = items.filter((tx) => tx.category?.id === categoryFilter);
        if (sourceFilter) items = items.filter((tx) => tx.incomeSource?.id === sourceFilter);
        return json(200, {
          items,
          page: 0,
          size: 20,
          totalItems: items.length,
          totalPages: 1,
        });
      }

      if (method === "POST") {
        const payload = body as Record<string, unknown>;
        const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        let category = null;
        if (payload.categoryId) {
          category = resolveCategory(String(payload.categoryId), state.customCategories);
        }
        let incomeSource = null;
        if (payload.incomeSourceId) {
          incomeSource = resolveIncomeSource(String(payload.incomeSourceId), state.customIncomeSources);
        }

        const tx: Transaction = {
          id,
          type: (payload.type as "INCOME" | "EXPENSE") ?? "EXPENSE",
          amount: String(payload.amount),
          date: String(payload.date),
          category: category ? { id: category.id, name: category.name, group: category.group } : null,
          incomeSource: incomeSource ? { id: incomeSource.id, name: incomeSource.name } : null,
          description: payload.description ? String(payload.description) : null,
          paymentMethod: payload.paymentMethod ? String(payload.paymentMethod) : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.transactions.set(id, tx);
        return json(201, tx);
      }

      if (method === "DELETE") {
        state.transactions.clear();
        return json(204, null);
      }
    }

    // Single transaction operations: GET, PATCH, DELETE
    if (path.startsWith("/api/v1/transactions/")) {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      const id = path.replace("/api/v1/transactions/", "");
      const tx = state.transactions.get(id);

      if (method === "GET") {
        if (!tx) return error(404, "NOT_FOUND", "Transaction not found.");
        return json(200, tx);
      }

      if (method === "PATCH") {
        if (!tx) return error(404, "NOT_FOUND", "Transaction not found.");
        const updates = body as Record<string, unknown>;

        let nextCategory = tx.category;
        if ("categoryId" in updates) {
          nextCategory = updates.categoryId
            ? resolveCategory(String(updates.categoryId), state.customCategories)
            : null;
        }

        let nextIncomeSource = tx.incomeSource;
        if ("incomeSourceId" in updates) {
          nextIncomeSource = updates.incomeSourceId
            ? resolveIncomeSource(String(updates.incomeSourceId), state.customIncomeSources)
            : null;
        }

        const updatedTx: Transaction = {
          ...tx,
          ...(updates.amount !== undefined ? { amount: String(updates.amount) } : {}),
          ...(updates.date !== undefined ? { date: String(updates.date) } : {}),
          category: nextCategory,
          incomeSource: nextIncomeSource,
          ...(updates.description !== undefined ? { description: updates.description ? String(updates.description) : null } : {}),
          ...(updates.paymentMethod !== undefined ? { paymentMethod: updates.paymentMethod ? String(updates.paymentMethod) : null } : {}),
          updatedAt: new Date().toISOString(),
        };
        state.transactions.set(id, updatedTx);
        return json(200, updatedTx);
      }

      if (method === "DELETE") {
        if (!tx) return error(404, "NOT_FOUND", "Transaction not found.");
        state.transactions.delete(id);
        return new Response(null, { status: 204 });
      }
    }

    // Month totals only (no plan); enough for pages that show recorded income and spend.
    if (method === "GET" && path === "/api/v1/dashboard") {
      if (!state.signedInAs) return error(401, "UNAUTHENTICATED", "Please sign in to continue.");
      const month = searchParams.get("month") ?? "";
      const inMonth = Array.from(state.transactions.values()).filter((tx) => tx.date.startsWith(month));
      const sum = (type: string) =>
        (inMonth.filter((tx) => tx.type === type).reduce((cents, tx) => cents + Math.round(Number(tx.amount) * 100), 0) / 100).toFixed(2);
      return json(200, {
        month,
        periodStart: `${month}-01`,
        periodEnd: `${month}-28`,
        hasBudget: false,
        plannedIncome: null,
        savingsTarget: null,
        allocationTotal: null,
        plannedTotal: null,
        overAllocationAmount: null,
        overAllocated: null,
        recordedIncome: sum("INCOME"),
        incomeTransactionCount: inMonth.filter((tx) => tx.type === "INCOME").length,
        totalSpent: sum("EXPENSE"),
        expenseTransactionCount: inMonth.filter((tx) => tx.type === "EXPENSE").length,
        groups: [],
      });
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
