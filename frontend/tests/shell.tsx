import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { AppShell } from "@/components/layout/AppShell";
import { AppShellContext, type AppShellActions } from "@/components/layout/AppShellContext";
import { AuthProvider } from "@/lib/auth/AuthProvider";

/** A page inside the real signed-in shell, so its dialogs and toast work as in the app. */
export function renderInShell(page: ReactElement) {
  return render(
    <AuthProvider>
      <AppShell>{page}</AppShell>
    </AuthProvider>,
  );
}

/** A page with stub shell actions, for pages that only need `notify` and `dataVersion`. */
export function renderWithShellStub(page: ReactElement, overrides: Partial<AppShellActions> = {}) {
  const actions: AppShellActions = {
    notify: vi.fn(),
    openAdd: vi.fn(),
    openTransaction: vi.fn(),
    openEdit: vi.fn(),
    dataVersion: 0,
    ...overrides,
  };
  const view = render(
    <AuthProvider>
      <AppShellContext.Provider value={actions}>{page}</AppShellContext.Provider>
    </AuthProvider>,
  );
  return { ...view, actions };
}
