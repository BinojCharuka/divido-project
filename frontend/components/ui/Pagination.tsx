import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/** Previous / next pager for a zero-based page index. Hidden when there is one page. */
export function Pagination({
  page,
  totalPages,
  label,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="list-footer pagination" aria-label={label}>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="action-pair">
        <Button onClick={() => onPageChange(page - 1)} disabled={page === 0}>
          <ChevronLeft size={15} aria-hidden="true" /> Previous
        </Button>
        <Button onClick={() => onPageChange(page + 1)} disabled={page + 1 >= totalPages}>
          Next <ChevronRight size={15} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
