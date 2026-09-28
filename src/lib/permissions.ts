export const appRoles = ["super_admin", "admin", "operations", "owner", "vendor"] as const;
export type AppRole = (typeof appRoles)[number];

export type Permission = 
  | "properties:read" | "properties:create" | "properties:update" 
  | "organization:manage"
  | "guests:read" | "guests:create" | "guests:update"
  | "owners:read" | "owners:create" | "owners:update"
  | "bookings:read" | "bookings:create" | "bookings:update"
  | "team:read" | "team:invite" | "team:change_role" | "team:change_status"
  | "security:manage";

const permissions: Record<Permission, readonly AppRole[]> = {
  "properties:read": ["super_admin", "admin", "operations", "owner"],
  "properties:create": ["super_admin", "admin"],
  "properties:update": ["super_admin", "admin"],
  "organization:manage": ["super_admin", "admin"],
  "guests:read": ["super_admin", "admin", "operations"],
  "guests:create": ["super_admin", "admin", "operations"],
  "guests:update": ["super_admin", "admin", "operations"],
  "owners:read": ["super_admin", "admin", "operations"],
  "owners:create": ["super_admin", "admin"],
  "owners:update": ["super_admin", "admin"],
  "bookings:read": ["super_admin", "admin", "operations", "owner"],
  "bookings:create": ["super_admin", "admin", "operations"],
  "bookings:update": ["super_admin", "admin", "operations"],
  "team:read": ["super_admin", "admin"],
  "team:invite": ["super_admin", "admin"],
  "team:change_role": ["super_admin", "admin"],
  "team:change_status": ["super_admin", "admin"],
  "security:manage": ["super_admin", "admin"],
};

/**
 * Roles that may be assigned when inviting a member. Only a super_admin may
 * assign or alter the super_admin role; this list is enforced further in the
 * database RPCs.
 */
export const assignableRoles: readonly AppRole[] = ["admin", "operations", "owner", "vendor"];

export function can(role: AppRole, permission: Permission) {
  return permissions[permission].includes(role);
}
