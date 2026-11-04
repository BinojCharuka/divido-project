import { notFound } from "next/navigation";
import { PrototypeLoader } from "./PrototypeLoader";

/**
 * Design reference only. The Figma prototype keeps sample and browser-stored data
 * and calls APIs that do not exist yet, so it must never act as the financial data
 * layer. It is served in development, or when NEXT_PUBLIC_ENABLE_PROTOTYPE=true.
 */
export default function PrototypePage() {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_PROTOTYPE !== "true") {
    notFound();
  }
  return <PrototypeLoader />;
}
