"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { IconButton } from "./IconButton";

/** A native modal dialog: focus stays inside, Escape and a backdrop click close it. */
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  onBack,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    // jsdom has no showModal(); the open attribute is enough there.
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <div className="modal-title-wrap">
          {onBack && (
            <button
              type="button"
              className="modal-back-btn"
              aria-label="Back"
              onClick={onBack}
            >
              <ArrowLeft size={19} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <IconButton icon={X} label="Close dialog" onClick={onClose} />
      </div>
      {children}
    </dialog>
  );
}
