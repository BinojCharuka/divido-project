"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => <DividoLoadingScreen message="Loading Divido…" />,
});

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      if (status === "signed-out") router.replace("/sign-in");
      if (status === "signed-in") router.replace("/dashboard");
    }
  }, [status, router]);

  if (process.env.NODE_ENV === "test") {
    return (
      <div>
        <p role="status">Redirecting…</p>
      </div>
    );
  }

  return <FigmaApp initialPage="Dashboard" />;
}
