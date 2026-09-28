"use client";

import { cancelBookingAction } from "@/app/dashboard/bookings/actions";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  return (
    <form action={cancelBookingAction}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm("Cancel this booking? This frees the dates for other bookings.")) {
            e.preventDefault();
          }
        }}
        className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
      >
        Cancel booking
      </button>
    </form>
  );
}
