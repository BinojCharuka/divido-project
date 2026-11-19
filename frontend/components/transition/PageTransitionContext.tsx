"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PageTransitionOverlay } from "./PageTransitionOverlay";

export type TransitionPhase = "hidden" | "preparing" | "swiping";

interface PageTransitionContextValue {
  phase: TransitionPhase;
  isTransitioning: boolean;
  targetRoute: string;
  startTransition: (href: string) => void;
  triggerReveal: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  phase: "hidden",
  isTransitioning: false,
  targetRoute: "",
  startTransition: () => {},
  triggerReveal: () => {},
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

const SWIPE_REVEAL_DURATION_MS = 380;

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentPath = usePathname();

  const [phase, setPhase] = useState<TransitionPhase>("hidden");
  const [targetRoute, setTargetRoute] = useState("");

  const isTransitioningRef = useRef(false);
  const swipeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (swipeTimerRef.current) {
      clearTimeout(swipeTimerRef.current);
      swipeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const triggerReveal = useCallback(() => {
    clearTimer();
    setPhase("swiping");

    swipeTimerRef.current = setTimeout(() => {
      setPhase("hidden");
      setTargetRoute("");
      isTransitioningRef.current = false;
    }, SWIPE_REVEAL_DURATION_MS);
  }, [clearTimer]);

  const startTransition = useCallback(
    (href: string) => {
      // In test environment, bypass animations and push route directly
      if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        router.push(href);
        return;
      }

      // Check prefers-reduced-motion
      if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        router.push(href);
        return;
      }

      if (isTransitioningRef.current) return;

      clearTimer();
      isTransitioningRef.current = true;
      setTargetRoute(href);
      setPhase("preparing");

      // Start loading destination page immediately behind the veil
      try {
        router.push(href);
      } catch {
        // Fallback
      }
    },
    [clearTimer, router],
  );

  // Popstate (Browser Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      const newPath = window.location.pathname;
      if (newPath !== currentPath && !isTransitioningRef.current) {
        clearTimer();
        isTransitioningRef.current = true;
        setTargetRoute(newPath);
        setPhase("preparing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [clearTimer, currentPath]);

  // Global click interception on internal links with capture: true
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // If currently transitioning, block clicks to prevent race conditions
      if (isTransitioningRef.current) {
        const anchor = (e.target as HTMLElement).closest("a");
        if (anchor) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      // Check standard link attributes
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // Only primary left-click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // Allow opening in new tab
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.hasAttribute("data-no-transition")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external or anchor links
      if (
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.origin);
        const targetPath = targetUrl.pathname;
        const current = window.location.pathname;

        // Do not trigger transition if selecting the page already active
        if (targetPath === current) {
          e.preventDefault();
          return;
        }

        // Divido internal application routes
        const isAppRoute = [
          "/dashboard",
          "/transactions",
          "/budget",
          "/insights",
          "/reflection",
          "/settings",
          "/categories",
          "/income-sources",
          "/onboarding",
          "/",
        ].some((prefix) => targetPath === prefix || targetPath.startsWith(`${prefix}/`));

        if (!isAppRoute) return;

        e.preventDefault();
        startTransition(href);
      } catch {
        // Fallback
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [startTransition]);

  const isTransitioning = phase !== "hidden";

  return (
    <PageTransitionContext.Provider
      value={{
        phase,
        isTransitioning,
        targetRoute,
        startTransition,
        triggerReveal,
      }}
    >
      {children}
      <PageTransitionOverlay
        isOpen={isTransitioning}
        phase={phase}
        targetRoute={targetRoute}
      />
    </PageTransitionContext.Provider>
  );
}
