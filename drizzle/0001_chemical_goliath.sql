CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"check_in_date" timestamp with time zone NOT NULL,
	"check_out_date" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"total_guests" integer DEFAULT 1 NOT NULL,
	"total_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"booking_source" text DEFAULT 'direct' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_dates_valid" CHECK (check_in_date < check_out_date)
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"identity_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_org_property_idx" ON "bookings" USING btree ("organization_id","property_id");--> statement-breakpoint
CREATE INDEX "bookings_org_guest_idx" ON "bookings" USING btree ("organization_id","guest_id");--> statement-breakpoint
CREATE INDEX "bookings_check_in_idx" ON "bookings" USING btree ("check_in_date");--> statement-breakpoint
CREATE INDEX "guests_org_idx" ON "guests" USING btree ("organization_id");
--> statement-breakpoint

ALTER TYPE "public"."property_status" ADD VALUE IF NOT EXISTS 'maintenance';--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "base_price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "cleaning_fee" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "security_deposit" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "house_rules" text;