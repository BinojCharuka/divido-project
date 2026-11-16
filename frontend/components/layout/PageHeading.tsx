import type { ReactNode } from "react";

/** Title row of a page, with optional supporting line and actions on the right. */
export function PageHeading({
  title,
  subtitle,
  actions,
  dashboard = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  dashboard?: boolean;
}) {
  return (
    <div className={`page-heading ${dashboard ? "dashboard-heading" : ""}`}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
  );
}
