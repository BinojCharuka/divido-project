import { ApiError } from "@/lib/api/client";

/** What to say when saving a plan fails. The entries always stay in the form. */
export function saveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === "validation") {
      return error.fieldErrors.month ?? "Your plan was not saved. Please correct the highlighted fields.";
    }
    if (error.kind === "unauthenticated") return "Your session has ended. Sign in again to save this plan.";
    if (error.kind === "network") return `Your plan was not saved. ${error.message}`;
  }
  return "Your plan was not saved because something went wrong. Your entries are kept; please try again.";
}
