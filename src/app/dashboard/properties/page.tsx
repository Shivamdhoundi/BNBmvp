/* eslint-disable @typescript-eslint/no-explicit-any */
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listProperties } from "@/server/properties/service";
import { PropertiesClient } from "./properties-client";

export default async function PropertiesPage() {
  const context = await requireOrganizationContext();
  const dbProperties = await listProperties(context.organization.id);

  // Safely map db properties to the type expected by the client
  const properties = dbProperties.map((p) => ({
    ...p,
    property_type: p.property_type ?? "other",
    management_commission_percent: (p as any).management_commission_percent ?? "20.00",
  }));

  const canCreate = can(context.role, "properties:create");

  return <PropertiesClient properties={properties} canCreate={canCreate} />;
}
