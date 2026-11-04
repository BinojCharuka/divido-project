import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  rightAction?: ReactNode;
  headerRight?: ReactNode;
};

/** A labelled input whose hint and error text are announced with it, supporting leading icons, trailing actions, and header right actions. */
export function TextField({
  label,
  hint,
  error,
  icon,
  rightAction,
  headerRight,
  className,
  ...input
}: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {headerRight}
      </div>
      <div className="group relative flex items-center">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-zinc-400 dark:text-zinc-500 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors">
            {icon}
          </div>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-xl border border-zinc-200/90 bg-zinc-50/60 py-2.5 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/15 aria-invalid:border-red-500 dark:border-white/[0.08] dark:bg-[#161c18]/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 hover:dark:border-white/[0.14] dark:focus:border-emerald-400 dark:focus:bg-[#161c18] dark:focus:ring-2 dark:focus:ring-emerald-400/20 dark:aria-invalid:border-red-400 ${
            icon ? "pl-10" : "px-3.5"
          } ${rightAction ? "pr-10" : "pr-3.5"}`}
          {...input}
        />
        {rightAction && (
          <div className="absolute right-2.5 flex items-center">
            {rightAction}
          </div>
        )}
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
