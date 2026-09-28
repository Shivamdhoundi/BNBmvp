import { describe, expect, it } from "vitest";

import { assignableRoles, can } from "@/lib/permissions";

describe("permission matrix", () => {
  it("restricts team management to admins and super_admins", () => {
    for (const perm of ["team:read", "team:invite", "team:change_role", "team:change_status", "security:manage"] as const) {
      expect(can("super_admin", perm)).toBe(true);
      expect(can("admin", perm)).toBe(true);
      expect(can("operations", perm)).toBe(false);
      expect(can("owner", perm)).toBe(false);
      expect(can("vendor", perm)).toBe(false);
    }
  });

  it("keeps property creation limited to admins", () => {
    expect(can("super_admin", "properties:create")).toBe(true);
    expect(can("admin", "properties:create")).toBe(true);
    expect(can("operations", "properties:create")).toBe(false);
    expect(can("owner", "properties:create")).toBe(false);
  });

  it("does not allow assigning super_admin via the assignable list", () => {
    expect(assignableRoles).not.toContain("super_admin");
  });
});
