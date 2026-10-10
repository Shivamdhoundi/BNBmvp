import { NextResponse } from "next/server";

import { can } from "@/lib/permissions";
import { getOrganizationContext } from "@/server/auth/context";
import { createProperty, listProperties } from "@/server/properties/service";
import { createPropertySchema } from "@/server/properties/validation";
import { getMfaGate } from "@/server/auth/mfa";
import { enforceRateLimit, RateLimitError } from "@/server/rate-limit";
import { getCanonicalAppOrigin } from "@/lib/auth/password-recovery";
import { readBoundedJson, RequestBodyError } from "@/lib/read-json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getOrganizationContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(context.role, "properties:read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((await getMfaGate(context)).kind !== "allow") return NextResponse.json({ error: "MFA required" }, { status: 403 });
    return NextResponse.json({ data: await listProperties(context.organization.id) });
  } catch {
    console.error(JSON.stringify({ event: "properties_read_failed" }));
    return NextResponse.json({ error: "Unable to load properties" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Cookie-authenticated JSON endpoints need their own origin check; the
  // framework's Server Action protection does not cover Route Handlers.
  const origin = request.headers.get("origin");
  if (!origin || origin !== getCanonicalAppOrigin()) return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }
  try {
    const context = await getOrganizationContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(context.role, "properties:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if ((await getMfaGate(context)).kind !== "allow") return NextResponse.json({ error: "MFA required" }, { status: 403 });
    await enforceRateLimit("property-create", context.user.id, 30);
    const parsed = createPropertySchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) return NextResponse.json({ error: "Invalid property input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const propertyId = await createProperty(context, parsed.data);
    return NextResponse.json({ data: { id: propertyId } }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof RateLimitError) return NextResponse.json({ error: error.message }, { status: error.unavailable ? 503 : 429, headers: { "Retry-After": "900" } });
    console.error(JSON.stringify({ event: "property_create_failed" }));
    return NextResponse.json({ error: "Unable to create property" }, { status: 500 });
  }
}
