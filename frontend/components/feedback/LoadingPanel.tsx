/** Accessible loading placeholder; announced politely to screen readers while page transition balances loading. */
export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="panel app-loading" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
    </div>
  );
}
