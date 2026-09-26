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
      <main className="relative flex min-h-screen items-center justify-center bg-slate-900 p-4 sm:p-8">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/properties/suite.png" 
            alt="Premium interior" 
            fill 
            className="object-cover opacity-60" 
            priority
          />
        </div>
        
        {/* Centered Card */}
        <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <BrandMark />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left side: Form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex justify-center lg:justify-start">
            <BrandMark />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-[15px] text-slate-500">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>

      {/* Right side: Image Panel */}
      <section className="relative hidden lg:block">
        <Image 
          src="/properties/villa.png" 
          alt="Premium luxury villa" 
          fill 
          className="object-cover" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-16 text-white">
          <h2 className="text-4xl font-bold leading-tight">
            You own<br />the BNB.<br />We run the<br />operation.
          </h2>
          <p className="mt-4 text-lg text-slate-300 max-w-sm font-medium">
            A simple, powerful tool for property management.
          </p>
        </div>
      </section>
    </main>
  );
}
