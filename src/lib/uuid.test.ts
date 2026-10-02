import { describe, expect, it } from "vitest";

import { isUuid } from "@/lib/uuid";

describe("isUuid", () => {
  it("accepts application UUIDs", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
  });

  it("rejects malformed route identifiers", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
  });
});
