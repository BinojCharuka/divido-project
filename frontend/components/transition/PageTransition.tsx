"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type Phase = "idle" | "cover" | "reveal";

const COVER_MS = 650;     // panels finish sliding in (incl. stagger)
const REVEAL_MS = 750;    // panels finish sliding out
const MAX_WAIT_MS = 8000; // slow client nav: fall back to a normal page load

export const ROUTE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/dashboard": "Overview",
  "/transactions": "History",
  "/budget": "Budget",
  "/insights": "Insights",
  "/reflection": "Reflection",
  "/categories": "Categories",
  "/income-sources": "Income Sources",
  "/settings": "Settings",
  "/onboarding": "Onboarding",
  "/sign-in": "Sign In",
  "/sign-up": "Sign Up",
};

const clean = (s: string | null | undefined) =>
  (s || "").replace(/[→↗←]/g, "").replace(/\s+/g, " ").trim();

export function labelFor(url: URL, link?: HTMLAnchorElement | null): string {
  const { pathname } = url;
  const linkText = link ? clean(link.getAttribute("aria-label") || link.textContent) : "";
  if (url.hash && linkText && linkText.length <= 28) return linkText;
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (route !== "/" && pathname.startsWith(route)) return label;
  }
  const heading = link ? clean(link.querySelector("h1, h2, h3, h4")?.textContent) : "";
  const text = heading || linkText;
  if (text && text.length <= 28) return text;
  return pathname.startsWith("/transactions") ? "History" : "Divido";
}

interface PageTransitionContextValue {
  phase: Phase;
  navigate: (href: string, label?: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue>({
  phase: "idle",
  navigate: () => {},
});

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState("");
  const pending = useRef<string | null>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reveal = useCallback(() => {
    clearTimers();             // 8s fallback cancel
    pending.current = null;    // navigation finished
    setPhase("reveal");        // panels slide out
    later(() => setPhase("idle"), REVEAL_MS);
  }, [clearTimers, later]);

  const target = useCallback((e: Event) => {
    const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link || (link.target && link.target !== "_self")) return null;
    if (link.hasAttribute("download") || link.dataset.noTransition !== undefined) return null;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname.startsWith("/api")) return null;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return null; // same page / #anchor
    return { link, url };
  }, []);

  const triggerTransition = useCallback(
    (href: string, customLabel?: string) => {
      if (pending.current) return;
      pending.current = href.split("?")[0].split("#")[0];

      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }

      const targetUrl = new URL(href, window.location.href);
      setLabel(customLabel || labelFor(targetUrl));
      clearTimers();
      setPhase("cover");
      router.prefetch(href);
      later(() => router.push(href), COVER_MS);
      later(() => window.location.assign(href), COVER_MS + MAX_WAIT_MS);
    },
    [clearTimers, later, router],
  );

  const onClick = useCallback(
    (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const hit = target(e);
      if (!hit) return;
      e.preventDefault();
      if (pending.current) return; // already on the way somewhere

      const href = hit.url.pathname + hit.url.search + hit.url.hash;
      triggerTransition(href, labelFor(hit.url, hit.link));
    },
    [target, triggerTransition],
  );

  const onHover = useCallback(
    (e: MouseEvent) => {
      const hit = target(e);
      if (hit) router.prefetch(hit.url.pathname + hit.url.search);
    },
    [router, target],
  );

  useEffect(() => {
    document.addEventListener("click", onClick, true); // true = capture phase
    document.addEventListener("mouseover", onHover, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onHover);
    };
  }, [onClick, onHover]);

  // When route changes to target route, wait for content readiness before revealing
  useEffect(() => {
    if (!pending.current) return;
    if (phase !== "cover") {
      pending.current = null; // reduced-motion navigation finished
      return;
    }

    let isDone = false;
    let observer: MutationObserver | null = null;
    let checkTimer: number | null = null;
    let pollTimer: number | null = null;
    let safetyTimer: number | null = null;

    const onReady = () => {
      if (isDone) return;
      isDone = true;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (checkTimer) clearTimeout(checkTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (safetyTimer) clearTimeout(safetyTimer);

      // Brief settling delay for browser layout & paint
      later(reveal, 80);
    };

    const hasLoadingIndicator = () => {
      if (typeof document === "undefined") return false;
      return Boolean(
        document.querySelector(".app-loading, .app-loading-bar, [data-loading='true'], .loading-panel")
      );
    };

    // Safety fallback: reveal after at most 2.5s even if backend is slow/offline
    safetyTimer = window.setTimeout(onReady, 2500);

    const observeForReady = () => {
      if (typeof MutationObserver !== "undefined" && document.body) {
        observer = new MutationObserver(() => {
          if (!hasLoadingIndicator()) {
            onReady();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }

      // Polling fallback to guarantee responsiveness across all environments
      pollTimer = window.setInterval(() => {
        if (!hasLoadingIndicator()) {
          onReady();
        }
      }, 50);
    };

    if (hasLoadingIndicator()) {
      observeForReady();
    } else {
      // Check after a brief tick in case React is currently mounting initial loading state
      checkTimer = window.setTimeout(() => {
        if (hasLoadingIndicator()) {
          observeForReady();
        } else {
          onReady();
        }
      }, 50);
    }

    return () => {
      if (observer) observer.disconnect();
      if (checkTimer) clearTimeout(checkTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <PageTransitionContext.Provider value={{ phase, navigate: triggerTransition }}>
      <div className="page-wipe" data-phase={phase} aria-hidden={phase === "idle"}>
        <div className="page-wipe__panel page-wipe__panel--orange" />
        <div className="page-wipe__panel page-wipe__panel--ink">
          <div className="page-wipe__label">
            <span className="page-wipe__mark" />
            {label}
          </div>
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}

/** Legacy provider wrapper for backwards compatibility */
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PageTransition />
    </>
  );
}
