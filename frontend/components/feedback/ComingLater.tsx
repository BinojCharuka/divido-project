import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { PageHeading } from "@/components/layout/PageHeading";

/** Honest placeholder for a feature planned for a later phase. Shows no sample figures. */
export function ComingLater({ title, icon: Icon, text }: { title: string; icon: LucideIcon; text: string }) {
  return (
    <>
      <PageHeading title={title} />
      <section className="panel empty-state coming-later">
        <Icon size={36} strokeWidth={1.5} aria-hidden="true" />
        <span className="status-badge">Coming in a later update</span>
        <h2>{title} isn’t available yet</h2>
        <p>{text}</p>
        <Link href="/dashboard" className="button button-primary">
          Back to dashboard <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
