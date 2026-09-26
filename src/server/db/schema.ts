import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const appRole = pgEnum("app_role", [
  "super_admin",
  "admin",
  "operations",
  "owner",
  "vendor",
]);
export const memberStatus = pgEnum("member_status", ["invited", "active", "suspended"]);
export const propertyStatus = pgEnum("property_status", [
  "draft",
  "onboarding",
  "active",
  "paused",
  "inactive",
  "maintenance",
]);
export const propertyType = pgEnum("property_type", [
  "apartment",
  "house",
  "villa",
  "studio",
  "serviced_apartment",
  "other",
]);
export const documentVisibility = pgEnum("document_visibility", ["internal", "owner"]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  fullName: text("full_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt,
  updatedAt,
});

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    defaultCurrency: varchar("default_currency", { length: 3 }).default("INR").notNull(),
    timezone: text("timezone").default("Asia/Kolkata").notNull(),
    countryCode: varchar("country_code", { length: 2 }).default("IN").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: appRole("role").default("operations").notNull(),
    status: memberStatus("status").default("invited").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(table.organizationId, table.userId),
    index("organization_members_user_status_idx").on(table.userId, table.status),
  ],
);

export const owners = pgTable(
  "owners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    legalName: text("legal_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    payoutNotes: text("payout_notes"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("owners_organization_active_idx").on(table.organizationId, table.isActive)],
);

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").references(() => owners.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    propertyType: propertyType("property_type").notNull(),
    status: propertyStatus("status").default("draft").notNull(),
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").default("Gurugram").notNull(),
    state: text("state").default("Haryana").notNull(),
    postalCode: text("postal_code"),
    countryCode: varchar("country_code", { length: 2 }).default("IN").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    timezone: text("timezone").default("Asia/Kolkata").notNull(),
    checkInTime: time("check_in_time").default("15:00").notNull(),
    checkOutTime: time("check_out_time").default("11:00").notNull(),
    basePrice: numeric("base_price", { precision: 10, scale: 2 }).default("0").notNull(),
    cleaningFee: numeric("cleaning_fee", { precision: 10, scale: 2 }).default("0").notNull(),
    securityDeposit: numeric("security_deposit", { precision: 10, scale: 2 }).default("0").notNull(),
    description: text("description"),
    houseRules: text("house_rules"),
    managementCommissionPercent: numeric("management_commission_percent", { precision: 5, scale: 2 }).default("20.00").notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("properties_org_slug_unique").on(table.organizationId, table.slug),
    index("properties_org_status_idx").on(table.organizationId, table.status),
    index("properties_org_owner_idx").on(table.organizationId, table.ownerId),
  ],
);

export const propertyUnits = pgTable(
  "property_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").default("Main unit").notNull(),
    bedrooms: numeric("bedrooms", { precision: 3, scale: 1 }).default("1").notNull(),
    bathrooms: numeric("bathrooms", { precision: 3, scale: 1 }).default("1").notNull(),
    maxGuests: integer("max_guests").default(2).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("property_units_property_name_unique").on(table.propertyId, table.name),
    index("property_units_org_property_idx").on(table.organizationId, table.propertyId),
    check("property_units_max_guests_positive", sql`max_guests > 0`),
  ],
);

export const propertyAmenities = pgTable(
  "property_amenities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => propertyUnits.id, { onDelete: "cascade" }),
    amenityKey: varchar("amenity_key", { length: 100 }).notNull(),
    details: text("details"),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("property_amenities_unique").on(table.propertyId, table.unitId, table.amenityKey),
    index("property_amenities_org_property_idx").on(table.organizationId, table.propertyId),
  ],
);

export const propertyDocuments = pgTable(
  "property_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type"),
    visibility: documentVisibility("visibility").default("internal").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [index("property_documents_org_property_idx").on(table.organizationId, table.propertyId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt,
  },
  (table) => [
    index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    identityVerified: boolean("identity_verified").default(false).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("guests_org_idx").on(table.organizationId)]
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
    checkInDate: timestamp("check_in_date", { withTimezone: true }).notNull(),
    checkOutDate: timestamp("check_out_date", { withTimezone: true }).notNull(),
    status: bookingStatus("status").default("pending").notNull(),
    totalGuests: integer("total_guests").default(1).notNull(),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).default("0").notNull(),
    bookingSource: text("booking_source").default("direct").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("bookings_org_property_idx").on(table.organizationId, table.propertyId),
    index("bookings_org_guest_idx").on(table.organizationId, table.guestId),
    index("bookings_check_in_idx").on(table.checkInDate),
    check("bookings_dates_valid", sql`check_in_date < check_out_date`),
  ]
);

export const propertySettings = pgTable(
  "property_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    settings: jsonb("settings").default({}).notNull(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("property_settings_property_unique").on(table.propertyId),
    index("property_settings_org_idx").on(table.organizationId),
  ]
);
