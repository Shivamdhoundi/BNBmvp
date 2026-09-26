import { NextResponse } from "next/server";

import { can } from "@/lib/permissions";
import { getOrganizationContext } from "@/server/auth/context";
import { createProperty, listProperties } from "@/server/properties/service";
import { createPropertySchema } from "@/server/properties/validation";

export async function GET() {
  try {
    const context = await getOrganizationContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ data: await listProperties(context.organization.id) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOrganizationContext();
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!can(context.role, "properties:create")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const parsed = createPropertySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid property input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    const propertyId = await createProperty(context, parsed.data);
    return NextResponse.json({ data: { id: propertyId } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create property" }, { status: 500 });
  }
}
