import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SessionBoundary } from "@/components/auth/SessionBoundary";

let mockStatus = "loading";
let mockRefresh = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    back: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: mockStatus,
    refresh: mockRefresh,
    user: mockStatus === "signed-in" ? { id: "1", email: "user@example.com", name: "User" } : null,
  }),
}));

describe("SessionBoundary & DividoLoadingScreen initial loading coordination", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockStatus = "loading";
    mockRefresh.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows DividoLoadingScreen when session status is loading", () => {
    mockStatus = "loading";
    render(
      <SessionBoundary>
        <div id="content">Dashboard Ready</div>
      </SessionBoundary>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Opening your personal money space…");
    expect(screen.queryByText("Dashboard Ready")).not.toBeInTheDocument();
  });

  it("keeps DividoLoadingScreen visible while dashboard content is loading, then fades out", () => {
    mockStatus = "signed-in";

    function MockDashboard({ loading }: { loading: boolean }) {
      return (
        <div>
          {loading && <div className="panel app-loading" role="status">Loading dashboard…</div>}
          {!loading && <div id="dashboard-content">Dashboard Ready</div>}
        </div>
      );
    }

    const { rerender } = render(
      <SessionBoundary>
        <MockDashboard loading={true} />
      </SessionBoundary>,
    );

    // Both children and DividoLoadingScreen should be rendered
    expect(screen.getByText("Opening your personal money space…")).toBeInTheDocument();

    // Advance 200ms -> Still loading, so DividoLoadingScreen stays visible
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText("Opening your personal money space…")).toBeInTheDocument();

    // Content finishes loading
    rerender(
      <SessionBoundary>
        <MockDashboard loading={false} />
      </SessionBoundary>,
    );

    // Advance 60ms (poll/observer) + 400ms fade-out
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // DividoLoadingScreen has unmounted, leaving the ready content
    expect(screen.queryByText("Opening your personal money space…")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard Ready")).toBeInTheDocument();
  });
});

