import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

/** A square icon-only button. `label` is its accessible name and tooltip. */
export function IconButton({
  icon: Icon,
  label,
  className = "icon-button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button type="button" className={className} aria-label={label} title={label} {...props}>
      <Icon size={19} aria-hidden="true" />
    </button>
  );
}
