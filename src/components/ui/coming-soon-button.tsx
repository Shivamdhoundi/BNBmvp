import type { ReactNode } from "react";

interface ComingSoonButtonProps {
  children: ReactNode;
  className?: string;
}

/**
 * A visibly disabled button for features that are not built yet.
 * It cannot be clicked and clearly communicates "coming soon" on hover.
 */
export function ComingSoonButton({ children, className }: ComingSoonButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Coming soon"
      className={`cursor-not-allowed opacity-50 ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
