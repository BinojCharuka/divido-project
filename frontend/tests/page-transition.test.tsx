import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { PageTransition, labelFor, ROUTE_LABELS } from "@/components/transition/PageTransition";

// Mock next/navigation
const mockPush = vi.fn();
const mockPrefetch = vi.fn();
let currentPathname = "/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: mockPrefetch,
  }),
  usePathname: () => currentPathname,
}));

describe("Brand Wipe Page Transition System", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockClear();
    mockPrefetch.mockClear();
    currentPathname = "/dashboard";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves route labels correctly for major routes", () => {
    expect(labelFor(new URL("http://localhost:3000/dashboard"))).toBe("Overview");
    expect(labelFor(new URL("http://localhost:3000/transactions"))).toBe("History");
    expect(labelFor(new URL("http://localhost:3000/budget"))).toBe("Budget");
    expect(labelFor(new URL("http://localhost:3000/insights"))).toBe("Insights");
    expect(labelFor(new URL("http://localhost:3000/reflection"))).toBe("Reflection");
    expect(labelFor(new URL("http://localhost:3000/settings"))).toBe("Settings");
  });

  it("extracts link text or heading for custom routes", () => {
    const link = document.createElement("a");
    link.href = "/custom-page";
    link.textContent = "My Custom Page →";
    expect(labelFor(new URL(link.href), link)).toBe("My Custom Page");
  });

  it("renders page-wipe container in idle phase with orange and ink panels", () => {
    render(<PageTransition />);

    const wipe = document.querySelector(".page-wipe");
    expect(wipe).toBeInTheDocument();
    expect(wipe).toHaveAttribute("data-phase", "idle");

    const orangePanel = document.querySelector(".page-wipe__panel--orange");
    const inkPanel = document.querySelector(".page-wipe__panel--ink");
    const mark = document.querySelector(".page-wipe__mark");

    expect(orangePanel).toBeInTheDocument();
    expect(inkPanel).toBeInTheDocument();
    expect(mark).toBeInTheDocument();
  });

  it("enters cover phase on link click and prefetches target route", async () => {
    render(
      <div>
        <a href="/budget">Go to Budget</a>
        <PageTransition />
      </div>
    );

    const wipe = document.querySelector(".page-wipe");
    expect(wipe).toHaveAttribute("data-phase", "idle");

    const link = screen.getByText("Go to Budget");
    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    // Should enter cover phase
    expect(wipe).toHaveAttribute("data-phase", "cover");
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(mockPrefetch).toHaveBeenCalledWith("/budget");

    // Advance 650ms (COVER_MS) -> router.push should be called
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(mockPush).toHaveBeenCalledWith("/budget");
  });

  it("skips wipe animation when link has data-no-transition", () => {
    render(
      <div>
        <a href="/budget" data-no-transition>
          Skip Transition
        </a>
        <PageTransition />
      </div>
    );

    const wipe = document.querySelector(".page-wipe");
    const link = screen.getByText("Skip Transition");

    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });

    expect(wipe).toHaveAttribute("data-phase", "idle");
  });

  it("holds cover phase while content is loading and reveals once ready", () => {
    const { rerender } = render(
      <div>
        <a href="/transactions">History</a>
        <PageTransition />
      </div>
    );

    const wipe = document.querySelector(".page-wipe");
    const link = screen.getByText("History");

    // Click link
    act(() => {
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
    expect(wipe).toHaveAttribute("data-phase", "cover");

    // Advance 650ms to trigger router.push
    act(() => {
      vi.advanceTimersByTime(650);
    });
    expect(mockPush).toHaveBeenCalledWith("/transactions");

    // Simulate route arrival with loading indicator in DOM
    currentPathname = "/transactions";
    const loadingEl = document.createElement("div");
    loadingEl.className = "panel app-loading";
    loadingEl.setAttribute("role", "status");
    document.body.appendChild(loadingEl);

    rerender(
      <div>
        <a href="/transactions">History</a>
        <PageTransition />
      </div>
    );

    // After 200ms, it should still be in cover phase because loadingEl is present
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(wipe).toHaveAttribute("data-phase", "cover");

    // Now remove loadingEl (data arrived)
    act(() => {
      loadingEl.remove();
    });

    // Advance settling delay (poll + settling)
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Should now transition to reveal phase
    expect(wipe).toHaveAttribute("data-phase", "reveal");

    // Advance 750ms (REVEAL_MS)
    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(wipe).toHaveAttribute("data-phase", "idle");
  });
});
