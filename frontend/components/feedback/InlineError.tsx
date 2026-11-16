import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** A page or section error, with an optional retry. */
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="inline-warning app-error" role="alert">
      <TriangleAlert size={20} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="app-error-retry">
          Try again
        </Button>
      )}
    </div>
  );
}
