"use client";

import { useMemo, useState } from "react";
import { format, addDays, startOfMonth, eachDayOfInterval, isSameDay, differenceInDays, isBefore, isAfter } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export function TimelineView({ properties, bookings }: TimelineViewProps) {
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));

  // Generate days for the current view (we'll do a 30 day sliding window)
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: currentDate,
      end: addDays(currentDate, 30),
    });
  }, [currentDate]);

  const handlePrev = () => setCurrentDate((d) => addDays(d, -7));
  const handleNext = () => setCurrentDate((d) => addDays(d, 7));
  const handleToday = () => setCurrentDate(startOfMonth(new Date()));

  const getBookingStyle = (booking: Booking) => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    
    // Calculate start position relative to timeline start
    let startOffset = differenceInDays(checkIn, days[0]);
    let duration = differenceInDays(checkOut, checkIn);
    
    // Handle bookings that start before our view
    if (startOffset < 0) {
      duration += startOffset; // Reduce duration by the days out of view
      startOffset = 0;
    }
    
    // Handle bookings that end after our view
    if (startOffset + duration > days.length) {
      duration = days.length - startOffset;
    }
    
    // +2 because grid columns are 1-indexed and column 1 is the property info sidebar
    return {
      gridColumnStart: startOffset + 2,
      gridColumnEnd: startOffset + 2 + duration,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-rose-500 border-rose-600 text-white';
      case 'pending': return 'bg-amber-100 border-amber-200 text-amber-800';
      case 'completed': return 'bg-emerald-100 border-emerald-200 text-emerald-800';
      case 'cancelled': return 'bg-slate-100 border-slate-200 text-slate-500 line-through';
      default: return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            <button onClick={handlePrev} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={handleToday} className="px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded">
              Today
            </button>
            <button onClick={handleNext} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto relative">
        <div 
          className="min-w-max"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `250px repeat(${days.length}, minmax(48px, 1fr))`,
          }}
        >
          {/* Header Row */}
          <div className="sticky top-0 z-20 col-span-1 border-b border-r border-slate-200 bg-slate-50 p-4 font-semibold text-slate-700 text-sm">
            Property
          </div>
          {days.map((day, i) => (
            <div 
              key={i} 
              className={`sticky top-0 z-10 border-b border-r border-slate-100 bg-slate-50 py-2 text-center text-sm ${
                isSameDay(day, new Date()) ? 'bg-rose-50 text-rose-600 font-bold' : 'text-slate-500'
              }`}
            >
              <div className="text-xs uppercase">{format(day, "EEE")}</div>
              <div>{format(day, "d")}</div>
            </div>
          ))}

          {/* Property Rows */}
          {properties.map((property, pIdx) => {
            const propertyBookings = bookings.filter(b => b.property_id === property.id && 
              // Only include bookings that overlap with our current view
              !isBefore(new Date(b.check_out_date), days[0]) && 
              !isAfter(new Date(b.check_in_date), days[days.length - 1])
            );

            return (
              <div key={property.id} className="contents group">
                {/* Property Sidebar Info */}
                <div className="sticky left-0 z-10 col-span-1 border-b border-r border-slate-200 bg-white p-4 group-hover:bg-slate-50 flex flex-col justify-center">
                  <span className="truncate font-semibold text-slate-900">{property.name}</span>
                  <span className="truncate text-xs text-slate-500">{property.city}</span>
                </div>

                {/* Grid Cells for this row */}
                {days.map((day, dIdx) => (
                  <div 
                    key={dIdx} 
                    className={`border-b border-r border-slate-100 group-hover:bg-slate-50/50 ${
                      isSameDay(day, new Date()) ? 'bg-rose-50/20' : ''
                    }`}
                    style={{ gridColumn: dIdx + 2 }}
                  />
                ))}

                {/* Bookings for this property */}
                {propertyBookings.map((booking) => {
                  const style = getBookingStyle(booking);
                  if (style.gridColumnEnd <= style.gridColumnStart) return null; // Outside view completely
                  
                  return (
                    <Link
                      href={`/dashboard/bookings/${booking.id}`}
                      key={booking.id}
                      className={`z-10 m-1 flex items-center overflow-hidden rounded-md border px-2 py-1 text-xs font-semibold shadow-sm transition hover:brightness-95 ${getStatusColor(booking.status)}`}
                      style={{
                        ...style,
                        gridRow: pIdx + 2, // +2 because row 1 is header
                      }}
                      title={`${booking.guests?.first_name} ${booking.guests?.last_name} - ${booking.status}`}
                    >
                      <span className="truncate">
                        {booking.guests?.first_name} {booking.guests?.last_name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
