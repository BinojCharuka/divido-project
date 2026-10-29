import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";

/** Real edit UI is intentionally blocked until TX-003/TX-004 are implemented and agreed. */
export default function EditTransactionPage() {
  return (
    <div className="mx-auto max-w-2xl pb-20 sm:pb-0">
      <Link href="/transactions" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary-strong)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">← Back to transactions</Link>
      <div className="mt-5"><EmptyState title="This transaction is unavailable" detail="Editing and deleting will be available once the read, update, and soft-delete contracts are connected to the backend." action={{ href: "/transactions", label: "Return to transactions" }} /></div>
    </div>
  );
}
