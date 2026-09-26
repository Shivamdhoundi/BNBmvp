import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Calendar,
  MessageSquare,
  Wrench,
  User,
  BarChart3,
  Check,
  Menu,
  PlayCircle,
  Home,
  MessageCircle,
  Sparkles,
  ClipboardCheck,
  ArrowDownToLine
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { isSupabaseConfigured } from "@/lib/env";
import { getSignedInUser } from "@/server/auth/context";

export default async function LandingPage() {
  if (isSupabaseConfigured()) {
    const user = await getSignedInUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-slate-200/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <BrandMark />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#product" className="hover:text-slate-900 transition-colors">Product</a>
            <a href="#solutions" className="hover:text-slate-900 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#resources" className="hover:text-slate-900 transition-colors">Resources</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105 hover:bg-slate-800"
            >
              Get started →
            </Link>
          </div>
          
          <button className="md:hidden text-slate-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="mx-auto max-w-7xl px-6 pt-16 lg:pt-24 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="max-w-xl">
            <div className="uppercase tracking-widest text-xs font-semibold text-slate-400 mb-6">
              Built for modern property managers
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Run your Airbnb <br />
              business without <br />
              the <span className="text-rose-600">busywork.</span>
            </h1>
            
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-md">
              StayPilot brings bookings, guests, cleaning, maintenance and owner payouts into one simple workspace.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link
                href="/sign-up"
                className="rounded-full bg-slate-900 px-7 py-3.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105 hover:bg-slate-800"
              >
                Start free trial →
              </Link>
              <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                <PlayCircle className="h-4 w-4" />
                Watch demo
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" /> Manage multiple properties
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-rose-500" /> Automate repetitive work
              </div>
            </div>
          </div>
          
          {/* Right Column - Image with Overlays */}
          <div className="relative h-[600px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50 bg-slate-100">
            <Image
              src="/properties/villa.png"
              alt="Luxury Villa"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay Gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
            
            {/* Overlay Cards */}
            <div className="absolute top-12 left-8 right-8 sm:right-auto space-y-4 max-w-[320px]">
              
              {/* Card 1 */}
              <div className="rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-black/5 border border-white/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">New Booking</p>
                      <p className="text-xs text-slate-500">2 nights • 2 guests</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Confirmed</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="h-6 w-6 rounded-full bg-slate-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Guest" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 flex justify-between text-xs text-slate-600">
                    <div>
                      <p className="text-[10px] text-slate-400">Check-in</p>
                      <p className="font-semibold text-slate-900">12 Oct</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Check-out</p>
                      <p className="font-semibold text-slate-900">14 Oct</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-black/5 border border-white/50 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Cleaning Assigned</p>
                  <p className="text-xs text-slate-500">Villa A • 14 Oct</p>
                </div>
                <div className="h-6 w-6 rounded-full bg-slate-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://i.pravatar.cc/150?u=123" alt="Cleaner" className="h-full w-full object-cover" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-black/5 border border-white/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Owner Payout Ready</p>
                    <p className="text-xs text-slate-500">₹24,850 • October 2026</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 3. INTEGRATIONS */}
      <section className="border-y border-slate-200/60 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Works with your favourite platforms
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple text representation for logos since we don't have SVGs */}
            <span className="text-xl font-bold text-[#FF5A5F]">airbnb</span>
            <span className="text-xl font-bold text-[#003580]">Booking.com</span>
            <span className="text-xl font-bold text-[#25D366]">WhatsApp</span>
            <span className="text-xl font-bold text-[#4285F4]">Google Calendar</span>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES */}
      <section className="border-b border-slate-200/60 bg-white py-8 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-6 flex min-w-max gap-8 divide-x divide-slate-100">
          {[
            { icon: Calendar, title: "Bookings", desc: "Sync & manage all your reservations" },
            { icon: MessageSquare, title: "Guest Communication", desc: "AI-powered replies & management" },
            { icon: Wrench, title: "Cleaning & Maintenance", desc: "Automate turnovers and track issues" },
            { icon: User, title: "Owner Management", desc: "Statements, payouts & insights" },
            { icon: BarChart3, title: "Reports & Analytics", desc: "Real-time data to grow your business" },
          ].map((feature, i) => (
            <div key={i} className={`flex items-start gap-4 ${i !== 0 ? 'pl-8' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                <feature.icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{feature.title}</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[150px]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PRODUCT SECTION */}
      <section id="product" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Dashboard UI Fake */}
          <div className="relative rounded-[2rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Window Controls */}
            <div className="h-10 border-b border-slate-100 flex items-center px-4 gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            </div>
            {/* Dashboard Content */}
            <div className="flex h-[450px]">
              {/* Sidebar */}
              <div className="w-48 border-r border-slate-100 bg-slate-50 p-4 space-y-2">
                <div className="h-6 w-24 bg-slate-200 rounded-md mb-8" />
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'bg-white shadow-sm border border-slate-100' : 'bg-transparent'}`} />
                ))}
              </div>
              {/* Main */}
              <div className="flex-1 p-8 space-y-6 bg-white">
                <div className="h-8 w-48 bg-slate-100 rounded-lg" />
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-24 rounded-xl border border-slate-100 p-4 flex flex-col justify-between">
                      <div className="h-3 w-16 bg-slate-100 rounded" />
                      <div className="h-6 w-24 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-48 rounded-xl border border-slate-100 p-4" />
                  <div className="h-48 rounded-xl border border-slate-100 p-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Text & Properties */}
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-slate-400 mb-4">
              Your properties. Our operations.
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
              From single homes to multi-unit portfolios.
            </h2>
            <p className="text-slate-500 mb-10 leading-relaxed">
              StayPilot is designed for independent hosts and professional property managers who want to scale without the chaos. Whether you manage one apartment or a growing portfolio, StayPilot keeps every reservation, guest request, turnover and payout organized.
            </p>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-8">
              {['Villas', 'Apartments', 'Boutique Stays', 'Farmhouses', 'Multi-Units'].map((cat, i) => (
                <span key={cat} className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-colors ${i === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cat}
                </span>
              ))}
            </div>
            
            {/* Property Carousel Fake */}
            <div className="flex gap-4 overflow-hidden relative">
              <div className="w-48 h-32 rounded-2xl overflow-hidden relative shrink-0">
                <Image src="/properties/villa.png" alt="Villa" fill className="object-cover" />
              </div>
              <div className="w-48 h-32 rounded-2xl overflow-hidden relative shrink-0">
                <Image src="/properties/suite.png" alt="Suite" fill className="object-cover" />
              </div>
              <div className="w-48 h-32 rounded-2xl overflow-hidden relative shrink-0">
                <Image src="/properties/penthouse.png" alt="Penthouse" fill className="object-cover" />
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 6. OPERATIONS SECTION */}
      <section className="bg-white py-24 border-y border-slate-200/60">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-16">The perfect workflow. Every time.</h2>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-px bg-slate-200 -z-10" />
            
            {[
              { icon: Calendar, text: "Booking confirmed" },
              { icon: MessageCircle, text: "Guest communication" },
              { icon: Home, text: "Check-in" },
              { icon: Wrench, text: "Cleaning dispatched" },
              { icon: ClipboardCheck, text: "Inspection" },
              { icon: BarChart3, text: "Owner reporting" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4 bg-white p-2">
                <div className="h-14 w-14 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-600">
                  <step.icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-semibold text-slate-700 max-w-[80px] text-center leading-tight">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. AI SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="uppercase tracking-widest text-xs font-semibold text-slate-400 mb-4">
              AI-Powered Operations
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
              Let AI handle the repetitive work.
            </h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              StayPilot automatically drafts responses for routine questions, detects urgent issues, and escalates sensitive matters to your human team.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Check className="h-4 w-4 text-slate-600" /></div>
                <span className="text-sm font-medium text-slate-700">Auto-draft guest replies</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Check className="h-4 w-4 text-slate-600" /></div>
                <span className="text-sm font-medium text-slate-700">Message intent summaries</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Check className="h-4 w-4 text-slate-600" /></div>
                <span className="text-sm font-medium text-slate-700">Urgent issue detection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Check className="h-4 w-4 text-slate-600" /></div>
                <span className="text-sm font-medium text-slate-700">Automated task creation</span>
              </div>
            </div>
            <p className="mt-8 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> All sensitive actions require human approval.
            </p>
          </div>

          {/* Chat Mockup */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 max-w-md ml-auto w-full">
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                <div className="bg-slate-100 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-700">
                  Hi, what time is check-in? My flight lands early.
                </div>
              </div>
              
              <div className="flex gap-3 flex-row-reverse">
                <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <BrandMark /> {/* Or just a simple S */}
                </div>
                <div className="bg-slate-900 text-white rounded-2xl rounded-tr-sm p-4 text-sm relative">
                  <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="h-2 w-2" /> Auto-draft
                  </span>
                  Check-in starts at 3:00 PM. I&apos;ll send your smart lock access instructions shortly! If you need to drop off bags earlier, please let me know.
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button className="text-xs font-semibold text-slate-500 hover:text-slate-900">Edit</button>
                <button className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-full">Approve & Send</button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 8. OWNER SECTION */}
      <section className="bg-slate-50 py-24 border-y border-slate-200/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Owners always know what is happening.</h2>
            <p className="text-slate-500">Provide complete transparency to your property owners without manual spreadsheets.</p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Monthly Statement</h3>
                <p className="text-sm text-slate-500">October 2026 • Villa A</p>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-full">
                <ArrowDownToLine className="h-4 w-4" /> Download PDF
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Gross Booking Revenue</span>
                <span className="text-sm font-semibold text-slate-900">₹1,24,000</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Platform Fees (Airbnb)</span>
                <span className="text-sm font-semibold text-rose-600">- ₹3,720</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Cleaning & Maintenance</span>
                <span className="text-sm font-semibold text-rose-600">- ₹8,500</span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-sm text-slate-600">Management Fee (20%)</span>
                <span className="text-sm font-semibold text-rose-600">- ₹24,800</span>
              </div>
              <div className="flex justify-between py-4 mt-2 bg-slate-50 rounded-xl px-4">
                <span className="font-bold text-slate-900">Net Owner Payout</span>
                <span className="font-bold text-slate-900 text-lg">₹86,980</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6">
          Spend less time managing stays. <br className="hidden sm:block" />
          <span className="text-rose-600">More time growing your portfolio.</span>
        </h2>
        <p className="text-lg text-slate-500 mb-10">
          Join the professional hosts running their entire business on StayPilot.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-200 transition-transform hover:scale-105 hover:bg-slate-800"
        >
          Get started today
        </Link>
      </section>

      {/* 10. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-slate-900" />
            <span className="font-bold text-slate-900">StayPilot</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 StayPilot. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-500 font-medium">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
