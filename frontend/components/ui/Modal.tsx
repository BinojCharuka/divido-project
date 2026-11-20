"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { IconButton } from "./IconButton";

/**
 * A native modal dialog & mobile bottom sheet with interactive touch gesture support:
 * - Swipe / drag down to minimize or dismiss the panel.
 * - Swipe / drag up or tap handle to expand the panel to full screen height.
 * - Buttery-smooth hardware-accelerated direct touch tracking.
 * - Accessible fallback with Escape, backdrop clicks, and header action buttons.
 */
export function Modal({
  title,
  subtitle,
  eyebrow,
  children,
  onClose,
  onBack,
  className = "",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Gesture tracking refs to ensure 60fps/120fps direct touch tracking without re-rendering per pixel
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const currentDeltaY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const isHandleTouch = useRef<boolean>(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  const handleTouchStart = (e: React.TouchEvent, fromHandle = false) => {
    const touch = e.touches[0];
    if (!touch) return;

    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchStartTime.current = Date.now();
    currentDeltaY.current = 0;
    isHandleTouch.current = fromHandle;

    const dialog = dialogRef.current;
    const isAtTop = dialog ? dialog.scrollTop <= 2 : true;

    // Only initiate drag if touching the handle OR if the modal body is scrolled to top
    if (fromHandle || isAtTop) {
      isDragging.current = true;
    } else {
      isDragging.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartY.current;
    const deltaX = touch.clientX - touchStartX.current;

    // If horizontal motion is dominant early, cancel vertical drag
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(currentDeltaY.current) < 10) {
      isDragging.current = false;
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) return;

    // If touching content and scrolling downwards while content is not at top, let native scroll work
    if (!isHandleTouch.current && deltaY < 0 && dialog.scrollTop > 0) {
      isDragging.current = false;
      return;
    }

    currentDeltaY.current = deltaY;

    if (deltaY > 0) {
      // Dragging downwards: move sheet down directly
      dialog.style.transform = `translate3d(0, ${deltaY}px, 0)`;
      dialog.style.transition = "none";
    } else if (deltaY < 0 && !isExpanded) {
      // Dragging upwards while compact: allow expanding resistance
      const dampedY = deltaY * 0.35;
      dialog.style.transform = `translate3d(0, ${dampedY}px, 0)`;
      dialog.style.transition = "none";
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const deltaY = currentDeltaY.current;
    const elapsed = Date.now() - touchStartTime.current;
    const velocityY = deltaY / Math.max(elapsed, 1);

    // Reset inline styles to let CSS transitions smoothly snap into place
    dialog.style.transform = "";
    dialog.style.transition = "";

    // 1. Check for Dismiss / Minimize to Closed
    if (deltaY > 120 || (deltaY > 50 && velocityY > 0.45)) {
      if (isExpanded && deltaY < 180 && velocityY < 0.6) {
        // Moderate downward drag when expanded minimizes back to compact
        setIsExpanded(false);
      } else {
        // Far downward drag or fast fling closes panel
        handleClose();
      }
      return;
    }

    // 2. Check for Expand to Full Screen
    if (!isExpanded && (deltaY < -40 || velocityY < -0.35)) {
      setIsExpanded(true);
      return;
    }

    // 3. Check for Minimize (from expanded back to compact)
    if (isExpanded && (deltaY > 45 || velocityY > 0.35)) {
      setIsExpanded(false);
      return;
    }
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${className} ${isExpanded ? "sheet-is-expanded" : ""} ${isClosing ? "sheet-is-closing" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      onTouchStart={(e) => handleTouchStart(e, false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Interactive Drag Handle Area for Mobile Touch Gesture Minimize / Expand */}
      <div
        className="sheet-drag-handle-area"
        onTouchStart={(e) => {
          e.stopPropagation();
          handleTouchStart(e, true);
        }}
        onClick={toggleExpanded}
        role="button"
        aria-label={isExpanded ? "Minimize panel to compact size" : "Expand panel to full screen"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <span className={`sheet-drag-handle-pill ${isExpanded ? "is-expanded" : ""}`} />
      </div>

      <div
        className="modal-heading"
        onTouchStart={(e) => {
          handleTouchStart(e, true);
        }}
      >
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
            {eyebrow && (
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-0.5">
                {eyebrow}
              </span>
            )}
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <IconButton icon={X} label="Close dialog" onClick={handleClose} />
      </div>
      {children}
    </dialog>
  );
}
