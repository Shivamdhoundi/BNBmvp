import Link from "next/link";

/** Aero Stays: a roofline forms the A while the trailing arc suggests lift. */
export function BrandSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      fill="none"
      className={className}
    >
      <path
        d="M14.5 47.5 30.4 17c.7-1.4 2.5-1.4 3.2 0l15.9 30.5"
        stroke="currentColor"
        strokeWidth="4.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.6 36.5h16.8"
        stroke="currentColor"
        strokeWidth="4.6"
        strokeLinecap="round"
      />
      <path
        d="M41.5 17.2c4.6-.8 8.5-3.1 11.2-6.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shared product identity for navigation and authentication. */
export function BrandMark({
  href = "/",
  tone = "dark",
  showTagline = true,
  className = "",
  onClick,
}: {
  href?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="Aero Stays home"
      className={`group inline-flex min-h-11 items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${tone === "light" ? "focus-visible:outline-white" : "focus-visible:outline-rose-600"} ${className}`}
    >
      <span className="brand-logo-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] text-white shadow-[0_8px_22px_-9px_rgba(190,18,60,0.75)]">
        <BrandSymbol className="h-9 w-9" />
      </span>
      <span className="flex min-w-0 flex-col text-left leading-tight">
        <span className={`whitespace-nowrap text-[1.25rem] font-extrabold tracking-[-0.045em] ${tone === "light" ? "text-white" : "text-slate-950"}`}>
          Aero <span className={tone === "light" ? "text-rose-300" : "text-rose-600"}>Stays</span>
        </span>
        {showTagline && (
          <span className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.17em] ${tone === "light" ? "text-slate-400" : "text-slate-500"}`}>
            Property operations
          </span>
        )}
      </span>
    </Link>
  );
}
