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

interface PageTransitionContextValue {
  isTransitioning: boolean;
  targetRoute: string;
  startTransition: (href: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  isTransitioning: false,
  targetRoute: "",
  startTransition: () => {},
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

const ANIMATION_DURATION = 440; // milliseconds for counter 0 -> 100%
const ROUTE_PUSH_DELAY = 180; // milliseconds to call router.push during counter
const HOLD_AT_100_MS = 60; // hold at 100% before curtain lifts
const CURTAIN_LIFT_MS = 380; // milliseconds for curtain to slide up

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentPath = usePathname();

  const [phase, setPhase] = useState<"hidden" | "active" | "revealing">("hidden");
  const [progress, setProgress] = useState(0);
  const [targetRoute, setTargetRoute] = useState("");

  const isTransitioningRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

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

      clearAllTimers();
      isTransitioningRef.current = true;
      setTargetRoute(href);
      setPhase("active");
      setProgress(0);

      const startTime = performance.now();
      let routePushed = false;

      // Animate percentage counter from 0 to 100
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / ANIMATION_DURATION);
        // Cubic ease-out
        const easedT = 1 - Math.pow(1 - rawT, 2.6);
        const currentPercent = Math.min(100, Math.round(easedT * 100));

        setProgress(currentPercent);

        // Midway through the counter, perform the background route transition
        if (!routePushed && elapsed >= ROUTE_PUSH_DELAY) {
          routePushed = true;
          try {
            router.push(href);
          } catch {
            // Safe fallback
          }
        }

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          // Counter reached 100%
          setProgress(100);
          if (!routePushed) {
            routePushed = true;
            router.push(href);
          }

          // Hold briefly at 100% so the user perceives the complete transition
          const holdTimer = setTimeout(() => {
            setPhase("revealing");

            // Allow the curtain lift animation to finish
            const exitTimer = setTimeout(() => {
              setPhase("hidden");
              setProgress(0);
              setTargetRoute("");
              isTransitioningRef.current = false;
            }, CURTAIN_LIFT_MS);

            timeoutsRef.current.push(exitTimer);
          }, HOLD_AT_100_MS);

          timeoutsRef.current.push(holdTimer);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [clearAllTimers, router],
  );

  // Transition handler specifically for browser Back / Forward (popstate)
  const triggerPopTransition = useCallback(
    (newPath: string) => {
      if (
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      if (isTransitioningRef.current) return;

      clearAllTimers();
      isTransitioningRef.current = true;
      setTargetRoute(newPath);
      setPhase("active");
      setProgress(0);

      const startTime = performance.now();
      const popDuration = 360;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / popDuration);
        const easedT = 1 - Math.pow(1 - rawT, 2.5);
        const currentPercent = Math.min(100, Math.round(easedT * 100));

        setProgress(currentPercent);

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setProgress(100);
          const holdTimer = setTimeout(() => {
            setPhase("revealing");
            const exitTimer = setTimeout(() => {
              setPhase("hidden");
              setProgress(0);
              setTargetRoute("");
              isTransitioningRef.current = false;
            }, CURTAIN_LIFT_MS);
            timeoutsRef.current.push(exitTimer);
          }, 40);
          timeoutsRef.current.push(holdTimer);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [clearAllTimers],
  );

  // Listen for browser Back/Forward (popstate) navigation
  useEffect(() => {
    const handlePopState = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        triggerPopTransition(newPath);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentPath, triggerPopTransition]);

  // Global click interception on internal links with capture: true
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // If currently transitioning, block clicks to prevent repeated animations
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
        isTransitioning,
        targetRoute,
        startTransition,
      }}
    >
      {children}
      <PageTransitionOverlay
        isOpen={isTransitioning}
        phase={phase}
        targetRoute={targetRoute}
        progress={progress}
      />
    </PageTransitionContext.Provider>
  );
}
