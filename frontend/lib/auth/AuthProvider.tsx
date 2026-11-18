"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, setUnauthenticatedListener } from "@/lib/api/client";
import * as authApi from "@/lib/auth/api";
import type { SignInInput, User } from "@/lib/auth/api";
import { reloadTo, signInPath, type SignInNotice } from "@/lib/navigation";

/**
 * Session state for the whole app, learned from GET /api/v1/auth/me. It drives
 * navigation only; the backend decides what each request may do. The user is
 * kept in memory, never in browser storage.
 */
export type AuthStatus = "loading" | "signed-in" | "signed-out" | "unavailable";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  signIn: (input: SignInInput) => Promise<User>;
  /** Signs out, then reloads the sign-in page so no signed-in state survives. */
  signOut: () => Promise<void>;
  /** Check the session again, e.g. after the API was unreachable. */
  refresh: () => Promise<void>;
  /** Replace the user after a profile change or onboarding. */
  updateUser: (changes: Partial<Pick<User, "displayName" | "onboardingComplete">>) => void;
  /** The server already ended the session (e.g. account deleted): drop it and reload sign-in. */
  endSession: (notice: SignInNotice) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Session = { status: Exclude<AuthStatus, "loading">; user: User | null };

async function loadSession(): Promise<Session> {
  try {
    const user = await authApi.fetchCurrentUser();
    return { status: user ? "signed-in" : "signed-out", user };
  } catch {
    return { status: "unavailable", user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const signedInRef = useRef(false);

  const applySession = useCallback((session: Session) => {
    setUser(session.user);
    setStatus(session.status);
  }, []);

  /** Drop the user now, then reload so hidden routes lose their state too. */
  const endSession = useCallback(
    (notice: SignInNotice) => {
      signedInRef.current = false;
      applySession({ status: "signed-out", user: null });
      reloadTo(signInPath(notice));
    },
    [applySession],
  );

  const refresh = useCallback(async () => {
    setStatus("loading");
    applySession(await loadSession());
  }, [applySession]);

  useEffect(() => {
    let active = true;
    void loadSession().then((session) => {
      if (active) applySession(session);
    });
    return () => {
      active = false;
    };
  }, [applySession]);

  // Any protected request answered with 401 means the session has ended. Only a
  // signed-in UI reacts, so a 401 while signed out can never cause a reload loop.
  useEffect(() => {
    signedInRef.current = status === "signed-in";
  }, [status]);
  useEffect(() => {
    setUnauthenticatedListener(() => {
      if (signedInRef.current) endSession("session-ended");
    });
    return () => setUnauthenticatedListener(null);
  }, [endSession]);

  const signIn = useCallback(
    async (input: SignInInput) => {
      const signedIn = await authApi.signIn(input);
      applySession({ status: "signed-in", user: signedIn });
      return signedIn;
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch (error) {
      // Already signed out on the server (expired or restarted): the outcome is the same.
      if (!(error instanceof ApiError && error.kind === "unauthenticated")) throw error;
    }
    endSession("signed-out");
  }, [endSession]);

  const updateUser = useCallback((changes: Partial<Pick<User, "displayName" | "onboardingComplete">>) => {
    setUser((current) => (current ? { ...current, ...changes } : current));
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signOut, refresh, updateUser, endSession }),
    [status, user, signIn, signOut, refresh, updateUser, endSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
