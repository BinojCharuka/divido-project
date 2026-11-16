/** Placeholder shown while a section loads; announced politely to screen readers. */
export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="panel app-loading" role="status" aria-live="polite">
      <span className="app-loading-bar" aria-hidden="true" />
      <span className="app-loading-bar short" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
