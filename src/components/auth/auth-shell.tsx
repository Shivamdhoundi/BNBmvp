import { BrandMark } from "@/components/brand-mark";

export function AuthShell({ children, eyebrow, title, description }: { children: React.ReactNode; eyebrow: string; title: string; description: string }) {
  return (
    <main className="grid min-h-screen bg-[#f7f8f6] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="hidden bg-[#0b3328] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandMark />
        <div className="max-w-lg">
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.2em] text-[#a8d7bd]">Property operations, simplified</p>
          <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.055em]">Make every stay feel effortlessly managed.</h1>
          <p className="mt-7 max-w-md text-lg leading-8 text-[#b6cec1]">A calm control centre for your homes, guests, and on-the-ground teams.</p>
        </div>
        <p className="text-sm text-[#a8d7bd]">Built for short-term rental teams in India.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden"><BrandMark /></div>
          <p className="text-sm font-medium text-[var(--brand)]">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17211d]">{title}</h2>
          <p className="mt-3 text-[15px] leading-6 text-[var(--muted)]">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}
