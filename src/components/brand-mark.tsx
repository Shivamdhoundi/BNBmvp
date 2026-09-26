import Link from "next/link";
import { Home } from "lucide-react";

export function BrandMark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 font-bold tracking-tight text-slate-900 transition hover:opacity-80">
      <Home className="h-6 w-6 text-slate-900" strokeWidth={2.5} />
      <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
        StayPilot
      </span>
    </Link>
  );
}
