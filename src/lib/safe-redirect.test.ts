import { describe, expect, it } from "vitest";

import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("allows internal absolute paths", () => {
    expect(safeInternalPath("/dashboard", "/fallback")).toBe("/dashboard");
    expect(safeInternalPath("/dashboard/team", "/fallback")).toBe("/dashboard/team");
  });

  it("rejects protocol-relative and external URLs", () => {
    expect(safeInternalPath("//attacker.example", "/fallback")).toBe("/fallback");
    expect(safeInternalPath("https://attacker.example", "/fallback")).toBe("/fallback");
    expect(safeInternalPath("http://attacker.example", "/fallback")).toBe("/fallback");
  });

  it("rejects missing or non-path values", () => {
    expect(safeInternalPath(null, "/fallback")).toBe("/fallback");
    expect(safeInternalPath(undefined, "/fallback")).toBe("/fallback");
    expect(safeInternalPath("dashboard", "/fallback")).toBe("/fallback");
  });
});
