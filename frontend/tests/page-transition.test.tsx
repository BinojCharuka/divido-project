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

describe("Page Transition System", () => {
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

    expect(getRouteMetadata("/reflection")).toEqual({
      title: "Monthly Reflection",
      eyebrow: "REVIEW",
      subtitle: "Habits, milestones & monthly takeaways",
    });

    expect(getRouteMetadata("/settings")).toEqual({
      title: "Settings & Preferences",
      eyebrow: "ACCOUNT",
      subtitle: "Profile details & workspace settings",
    });

    expect(getRouteMetadata("/categories")).toEqual({
      title: "Expense Categories",
      eyebrow: "MANAGEMENT",
      subtitle: "Custom & standard budget categories",
    });

    expect(getRouteMetadata("/income-sources")).toEqual({
      title: "Income Sources",
      eyebrow: "MANAGEMENT",
      subtitle: "Configured streams & earning channels",
    });
  });

  it("renders the transition overlay with counter, progress bar and dynamic title when active", () => {
    const { rerender } = render(
      <PageTransitionOverlay
        isOpen={true}
        phase="active"
        targetRoute="/budget"
        progress={72}
      />
    );

    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
    expect(screen.getByText("PLANNING")).toBeInTheDocument();
    expect(screen.getByText("Monthly Budget")).toBeInTheDocument();
    expect(screen.getByText("Divido System")).toBeInTheDocument();

    const overlay = document.querySelector(".page-transition-overlay");
    expect(overlay).toHaveClass("is-active");

    // Rerender in revealing phase
    rerender(
      <PageTransitionOverlay
        isOpen={true}
        phase="revealing"
        targetRoute="/budget"
        progress={100}
      />
    );
    expect(document.querySelector(".page-transition-overlay")).toHaveClass("is-revealing");
  });

  it("does not render when isOpen is false or phase is hidden", () => {
    render(
      <PageTransitionOverlay
        isOpen={false}
        phase="hidden"
        targetRoute="/budget"
        progress={0}
      />
    );

    expect(document.querySelector(".page-transition-overlay")).toBeNull();
  });

  it("provides transition context and handles programmatic navigation", () => {
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
