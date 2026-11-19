import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getRouteMetadata } from "@/components/transition/routeTitles";
import { PageTransitionOverlay } from "@/components/transition/PageTransitionOverlay";
import { PageTransitionProvider, usePageTransition } from "@/components/transition/PageTransitionContext";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("Upward Swipe Page Transition System", () => {
  it("resolves route metadata dynamically for all major Divido pages", () => {
    expect(getRouteMetadata("/dashboard")).toEqual({
      title: "Overview",
      eyebrow: "DASHBOARD",
      subtitle: "Financial summary & available balance",
    });

    expect(getRouteMetadata("/transactions")).toEqual({
      title: "Transaction History",
      eyebrow: "RECORDS",
      subtitle: "Income & expense transaction log",
    });

    expect(getRouteMetadata("/budget")).toEqual({
      title: "Monthly Budget",
      eyebrow: "PLANNING",
      subtitle: "Spending limits & category targets",
    });

    expect(getRouteMetadata("/insights")).toEqual({
      title: "Financial Insights",
      eyebrow: "ANALYTICS",
      subtitle: "Factual spending patterns & observations",
    });
  });

  it("renders a minimal luxury curtain without any percentage counter or numbers", () => {
    const { rerender } = render(
      <PageTransitionOverlay
        isOpen={true}
        phase="preparing"
        targetRoute="/budget"
      />
    );

    const curtain = document.querySelector(".page-transition-curtain");
    expect(curtain).toBeInTheDocument();
    expect(curtain).toHaveClass("is-preparing");

    // Strictly ensure no percentage counters, numbers, or progress bars are present
    expect(screen.queryByText("%")).toBeNull();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.queryByText("100")).toBeNull();
    expect(document.querySelector(".transition-progress-track")).toBeNull();

    // Rerender in swiping out phase
    rerender(
      <PageTransitionOverlay
        isOpen={true}
        phase="swiping"
        targetRoute="/budget"
      />
    );
    expect(document.querySelector(".page-transition-curtain")).toHaveClass("is-swiping-out");
  });

  it("does not render when isOpen is false or phase is hidden", () => {
    render(
      <PageTransitionOverlay
        isOpen={false}
        phase="hidden"
        targetRoute="/budget"
      />
    );

    expect(document.querySelector(".page-transition-curtain")).toBeNull();
  });

  it("provides transition context and handles navigation requests", () => {
    function TestConsumer() {
      const { startTransition } = usePageTransition();
      return (
        <button type="button" onClick={() => startTransition("/transactions")}>
          Go to Transactions
        </button>
      );
    }

    render(
      <PageTransitionProvider>
        <TestConsumer />
      </PageTransitionProvider>
    );

    const button = screen.getByText("Go to Transactions");
    act(() => {
      button.click();
    });

    expect(mockPush).toHaveBeenCalledWith("/transactions");
  });
});
