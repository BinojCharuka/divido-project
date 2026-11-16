"use client";

/** The "Show inactive" switch shared by the category and income source lists. */
export function ShowInactiveToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="checkbox-field inline">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Show inactive
    </label>
  );
}
