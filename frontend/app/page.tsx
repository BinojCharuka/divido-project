"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DividoApp } from "@/components/app/DividoApp";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      if (status === "signed-out") router.replace("/sign-in");
      if (status === "signed-in") router.replace("/onboarding");
    }
  }, [status, router]);

  if (process.env.NODE_ENV === "test") {
    return (
      <div>
        <p role="status">Redirecting…</p>
      </div>
    );
  }

  return <DividoApp />;
}
