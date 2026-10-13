import Image from "next/image";
import { BrandMark } from "@/components/brand-mark";

export function AuthShell({
  children,
  title,
  description,
  mode = "split",
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  mode?: "split" | "centered";
}) {
  if (mode === "centered") {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Image
            src="/properties/suite.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/65 to-rose-950/50" />
          <div className="absolute -left-32 -top-48 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute -bottom-48 -right-24 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="brand-enter relative z-10 w-full max-w-[440px]">
          <section className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-[0_30px_100px_-20px_rgba(0,0,0,0.55)]">
            <div aria-hidden="true" className="brand-logo-surface h-1.5 w-full" />
            <div className="px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
              <BrandMark href="/sign-in" />
              <div className="mt-9">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">Your operations workspace</p>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
              <div className="mt-8">{children}</div>
            </div>
          </section>
          <p className="mt-6 text-center text-xs font-medium tracking-wide text-slate-200/80">
            Private access · Made for property operations
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-10"><BrandMark href="/sign-in" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">Your operations workspace</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-[15px] leading-6 text-slate-600">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <Image src="/properties/villa.png" alt="" fill sizes="50vw" className="object-cover opacity-85" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 xl:p-16">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">StayPilot</span>
          <h2 className="mt-7 text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            Every property.<br />Every stay.<br /><span className="text-rose-300">One clear view.</span>
          </h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-slate-200">
            Property operations, bookings and your team — together in one workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
