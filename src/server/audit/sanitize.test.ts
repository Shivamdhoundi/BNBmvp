import { describe, expect, it } from "vitest";

import { sanitizeAuditMetadata } from "@/server/audit/sanitize";

describe("sanitizeAuditMetadata", () => {
  it("strips forbidden secret-like keys", () => {
    const result = sanitizeAuditMetadata({
      password: "secret",
      token: "abc",
      access_token: "xyz",
      service_role_key: "k",
      totp_secret: "s",
      role: "admin",
    });
    expect(result).toEqual({ role: "admin" });
  });

  it("keeps only primitive values and primitive arrays", () => {
    const result = sanitizeAuditMetadata({
      count: 3,
      active: true,
      name: "villa",
      nested: { a: 1 },
      list: ["a", "b", 2],
      fn: () => 1,
    });
    expect(result).toEqual({ count: 3, active: true, name: "villa", list: ["a", "b", 2] });
  });

  it("is case-insensitive for forbidden keys", () => {
    const result = sanitizeAuditMetadata({ Password: "x", TOKEN: "y", ok: "keep" });
    expect(result).toEqual({ ok: "keep" });
  });
});
