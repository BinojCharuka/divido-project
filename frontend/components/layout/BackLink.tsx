import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-button back-link">
      <ArrowLeft size={15} aria-hidden="true" /> {label}
    </Link>
  );
}
