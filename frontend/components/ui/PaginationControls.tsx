import { Button } from "./Button";

export interface PaginationControlsProps {
  page: number; // 0-indexed
  totalPages: number;
  totalItems: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPageChange,
  className = "",
}: PaginationControlsProps) {
  if (totalPages <= 1 && totalItems <= 0) return null;

  const currentDisplayPage = page + 1;
  const hasPrev = page > 0;
  const hasNext = currentDisplayPage < totalPages;

  return (
    <div className={`flex items-center justify-between gap-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 ${className}`}>
      <span className="text-xs sm:text-sm">
        Showing page <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentDisplayPage}</span> of{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{Math.max(totalPages, 1)}</span> ({totalItems}{" "}
        {totalItems === 1 ? "record" : "records"})
      </span>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
