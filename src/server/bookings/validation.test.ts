import { describe, expect, it } from "vitest";

import { createBookingSchema } from "@/server/bookings/validation";

const validBooking = {
  propertyId: "123e4567-e89b-42d3-a456-426614174000",
  guestId: "123e4567-e89b-42d3-b456-426614174001",
  checkInDate: "2026-10-02",
  checkOutDate: "2026-10-04",
  status: "confirmed",
  totalGuests: 2,
  totalPrice: 12000,
  bookingSource: "direct",
};

describe("createBookingSchema", () => {
  it("accepts a valid date range", () => {
    expect(createBookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("rejects malformed dates", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, checkInDate: "02/10/2026" }).success).toBe(false);
  });

  it("rejects a check-out date that is not after check-in", () => {
    expect(createBookingSchema.safeParse({ ...validBooking, checkOutDate: "2026-10-02" }).success).toBe(false);
  });
});
