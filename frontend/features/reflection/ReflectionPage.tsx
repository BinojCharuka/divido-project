import { BookOpen } from "lucide-react";
import { ComingLater } from "@/components/feedback/ComingLater";

/** Monthly reflection (DIV-028) waits for owner decisions DEC-030 and DEC-034..040. */
export function ReflectionPage() {
  return (
    <ComingLater
      title="Monthly reflection"
      icon={BookOpen}
      text="A short end-of-month review is planned. Until then, compare the month with your plan on the dashboard."
    />
  );
}
