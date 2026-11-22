"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Renders the signed-in app only with a valid session and sends everyone else to
 * sign-in. Holds the high-craft DividoLoadingScreen on initial site entry until
 * destination page content (such as dashboard) is fully loaded and ready in the DOM.
 */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, refresh } = useAuth();

  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedInitialRef = useRef(false);

  useEffect(() => {
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  useEffect(() => {
    if (status !== "signed-in" || hasFinishedInitialRef.current) return;

    let isDone = false;
    let observer: MutationObserver | null = null;
    let pollTimer: number | null = null;
    let safetyTimer: number | null = null;
    let checkTimer: number | null = null;

    const onContentReady = () => {
      if (isDone) return;
      isDone = true;
      hasFinishedInitialRef.current = true;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (pollTimer) clearInterval(pollTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      if (checkTimer) clearTimeout(checkTimer);

      setIsFadingOut(true);
      window.setTimeout(() => {
        setInitialLoaded(true);
      }, 400);
    };

    const hasLoadingIndicator = () => {
      if (typeof document === "undefined") return false;
      return Boolean(
        document.querySelector(".app-loading, .app-loading-bar, [data-loading='true'], .loading-panel")
      );
    };

    // Safety fallback: dismiss loading screen after at most 3.5s so user is never stuck
    safetyTimer = window.setTimeout(onContentReady, 3500);

    const observeForReady = () => {
      if (typeof MutationObserver !== "undefined" && document.body) {
        observer = new MutationObserver(() => {
          if (!hasLoadingIndicator()) {
            onContentReady();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }

      // Polling fallback to guarantee responsiveness
      pollTimer = window.setInterval(() => {
        if (!hasLoadingIndicator()) {
          onContentReady();
        }
      }, 50);
    };

    if (hasLoadingIndicator()) {
      observeForReady();
    } else {
      checkTimer = window.setTimeout(() => {
        if (hasLoadingIndicator()) {
          observeForReady();
        } else {
          onContentReady();
        }
      }, 60);
    }

    return () => {
      if (observer) observer.disconnect();
      if (pollTimer) clearInterval(pollTimer);
      if (safetyTimer) clearTimeout(safetyTimer);
      if (checkTimer) clearTimeout(checkTimer);
    };
  }, [status]);

  if (status === "unavailable") {
    return (
      <div className="auth-page">
        <div className="auth-card app-unavailable" role="alert">
          <h1>We couldn&apos;t reach Divido</h1>
          <p>Check your connection and try again.</p>
          <Button variant="primary" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "signed-in") {
    return <DividoLoadingScreen message={status === "loading" ? "Opening your personal money space…" : "Redirecting…"} />;
  }

  return (
    <>
      {children}
      {!initialLoaded && (
        <DividoLoadingScreen
          message="Opening your personal money space…"
          className={`z-[99999] transition-opacity duration-400 ease-out ${
            isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        />
      )}
    </>
  );
}
