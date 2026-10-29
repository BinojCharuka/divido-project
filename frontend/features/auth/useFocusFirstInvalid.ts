import { useEffect, useRef } from "react";

/**
 * After a failed submit, move focus to the first field marked invalid, or back to
 * the submit button. The button was disabled while pending, which drops focus.
 */
export function useFocusFirstInvalid(failedSubmits: number) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (failedSubmits === 0) return;
    const form = formRef.current;
    (
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>('button[type="submit"]')
    )?.focus();
  }, [failedSubmits]);
  return formRef;
}
