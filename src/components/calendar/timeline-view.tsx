"use client";

import { useMemo, useState } from "react";
import {
  format,
  addDays,
  eachDayOfInterval,
  isSameDay,
  differenceInDays,
  isBefore,
  isAfter,
  isWeekend,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Home } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  property_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  guests?: {
    first_name: string;
    last_name: string;
  };
}

interface Property {
  id: string;
  name: string;
  city: string;
}

interface TimelineViewProps {
  properties: Property[];
  bookings: Booking[];
}

const STATUS_LEGEND = [
  { label: "Confirmed", dot: "bg-rose-500" },
  { label: "Pending", dot: "bg-amber-400" },
  { label: "Completed", dot: "bg-emerald-500" },
  { label: "Cancelled", dot: "bg-slate-300" },
];

const VIEW_DAYS = 21;

function bookingClasses(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-rose-500 text-white ring-rose-600/20";
    case "pending":
      return "bg-amber-400 text-amber-950 ring-amber-500/20";
    case "completed":
      return "bg-emerald-500 text-white ring-emerald-600/20";
    case "cancelled":
      return "bg-slate-200 text-slate-500 line-through ring-slate-300/40";
    default:
      return "bg-sky-500 text-white ring-sky-600/20";
  }
}

export function TimelineView({ properties, bookings }: TimelineViewProps) {
  // Start on the week containing today so bookings are immediately visible.
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = useMemo(
    () => eachDayOfInterval({ start: startDate, end: addDays(startDate, VIEW_DAYS - 1) }),
    [startDate]
  );

  const handlePrev = () => setStartDate((d) => addDays(d, -7));
  const handleNext = () => setStartDate((d) => addDays(d, 7));
  const handleToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const rangeLabel = `${format(days[0], "d MMM")} – ${format(days[days.length - 1], "d MMM yyyy")}`;
  const monthLabel = format(days[Math.floor(days.length / 2)], "MMMM yyyy");

  const nights = (b: Booking) =>
    Math.max(1, differenceInDays(new Date(b.check_out_date), new Date(b.check_in_date)));

  const getBookingSpan = (booking: Booking) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);

    let startOffset = differenceInDays(checkIn, days[0]);
    let duration = differenceInDays(checkOut, checkIn);

    if (startOffset < 0) {
      duration += startOffset;
      startOffset = 0;
    }
    if (startOffset + duration > days.length) {
      duration = days.length - startOffset;
    }

    return {
      gridColumnStart: startOffset + 2,
      gridColumnEnd: startOffset + 2 + duration,
    };
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-5 w-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-900">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 p-1 shadow-sm">
            <button
              onClick={handlePrev}
              aria-label="Previous week"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleToday}
              className="rounded-full px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-95"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              aria-label="Next week"
              className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <span className="hidden text-sm text-slate-400 md:inline">{rangeLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {STATUS_LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Home className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No properties yet</h3>
          <p className="max-w-sm text-sm text-slate-500">
            Add a property to start tracking availability and bookings on the calendar.
          </p>
          <Link
            href="/dashboard/properties/new"
            className="mt-1 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="flex-1 overflow-auto scroll-smooth">
          <div className="grid min-w-max grid-cols-[120px_repeat(21,44px)] sm:grid-cols-[240px_repeat(21,52px)]">
            {/* Header: Property label cell */}
            <div className="sticky left-0 top-0 z-30 col-span-1 border-b border-r border-slate-100 bg-white/95 px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 backdrop-blur sm:px-4 sm:text-xs">
              Property
            </div>
            {/* Header: day cells */}
            {days.map((day, i) => {
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={i}
                  className={`sticky top-0 z-10 border-b border-slate-100 py-2 text-center backdrop-blur transition ${
                    today ? "bg-rose-50" : isWeekend(day) ? "bg-slate-50/70" : "bg-white/95"
                  }`}
                >
                  <div className={`text-[10px] font-medium uppercase tracking-wide ${today ? "text-rose-500" : "text-slate-400"}`}>
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`mx-auto mt-0.5 grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${
                      today ? "bg-rose-500 text-white shadow-sm" : "text-slate-700"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}

            {/* Property rows */}
            {properties.map((property, pIdx) => {
              const propertyBookings = bookings.filter(
                (b) =>
                  b.property_id === property.id &&
                  !isBefore(new Date(b.check_out_date), days[0]) &&
                  !isAfter(new Date(b.check_in_date), days[days.length - 1])
              );

              return (
                <div key={property.id} className="contents group">
                  {/* Sidebar cell */}
                  <div className="sticky left-0 z-20 col-span-1 flex min-w-0 flex-col justify-center border-b border-r border-slate-100 bg-white px-2 py-3 transition group-hover:bg-slate-50 sm:px-4 sm:py-4">
                    <span className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900 sm:truncate sm:text-sm">{property.name}</span>
                    <span className="truncate text-[10px] text-slate-400 sm:text-xs">{property.city}</span>
                  </div>

                  {/* Day cells */}
                  {days.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className={`min-h-[64px] border-b border-r border-slate-50 transition group-hover:bg-slate-50/40 ${
                        isSameDay(day, new Date())
                          ? "bg-rose-50/40"
                          : isWeekend(day)
                            ? "bg-slate-50/40"
                            : ""
                      }`}
                      style={{ gridColumn: dIdx + 2 }}
                    />
                  ))}

                  {/* Booking pills */}
                  {propertyBookings.map((booking) => {
                    const span = getBookingSpan(booking);
                    if (span.gridColumnEnd <= span.gridColumnStart) return null;

                    const first = booking.guests?.first_name ?? "Guest";
                    const last = booking.guests?.last_name ?? "";
                    const guestName = `${first} ${last}`.trim();
                    const initials = `${first[0] ?? "G"}${last[0] ?? ""}`.toUpperCase();
                    const nightCount = nights(booking);

                    return (
                      <Link
                        href={`/dashboard/bookings/${booking.id}/edit`}
                        key={booking.id}
                        className={`z-10 my-2 flex items-center gap-2 self-center overflow-hidden rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${bookingClasses(
                          booking.status
                        )}`}
                        style={{ ...span, gridRow: pIdx + 2 }}
                        title={`${guestName} · ${booking.status} · ${format(new Date(booking.check_in_date), "d MMM")} → ${format(new Date(booking.check_out_date), "d MMM")} (${nightCount} night${nightCount > 1 ? "s" : ""})`}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/25 text-[10px] font-bold">
                          {initials}
                        </span>
                        <span className="truncate">{guestName}</span>
                        <span className="ml-auto shrink-0 text-[10px] opacity-80">{nightCount}n</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
