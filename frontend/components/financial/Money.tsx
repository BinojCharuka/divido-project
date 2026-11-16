import { amountDigits } from "@/lib/formatting/decimal";

/**
 * An LKR amount from an API decimal string, formatted as text so no digit can change.
 * `sign` adds an explicit "+" / "−" when the direction is not carried by a label.
 */
export function Money({ value, sign, className }: { value: string | null | undefined; sign?: "+" | "−"; className?: string }) {
  return (
    <span className={className}>
      {sign ? `${sign} ` : ""}LKR {amountDigits(value)}
    </span>
  );
}
