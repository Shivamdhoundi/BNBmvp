import Link from "next/link";

export function BrandSymbol({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      fill="none"
      className={className}
    >
      <path d="M13.5 31.5 32 16l18.5 15.5" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.5 31.5v16.2h23V31.5" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m28 40.5 9-9m-5.6 0H37v5.6" stroke="currentColor" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Single reusable product identity for navigation and authentication. */
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
      aria-label="StayPilot home"
      className={`group inline-flex min-h-11 items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${tone === "light" ? "focus-visible:outline-white" : "focus-visible:outline-rose-600"} ${className}`}
    >
      <span className="brand-logo-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] text-white shadow-[0_8px_22px_-9px_rgba(190,18,60,0.75)]">
        <BrandSymbol className="h-9 w-9" />
      </span>
      <span className="flex min-w-0 flex-col text-left leading-tight">
        <span className={`text-[1.25rem] font-extrabold tracking-[-0.045em] ${tone === "light" ? "text-white" : "text-slate-950"}`}>
          Stay<span className={tone === "light" ? "text-rose-300" : "text-rose-600"}>Pilot</span>
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
