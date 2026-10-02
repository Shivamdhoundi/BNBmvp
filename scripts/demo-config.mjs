import { config } from "dotenv";

config({ path: ".env.local" });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getDemoMutationConfig() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const organizationId = process.env.DEMO_ORGANIZATION_ID?.trim();
  const confirmed = process.env.DEMO_DATA_CONFIRM === "ALLOW_DEMO_DATA_MUTATION";

  if (!databaseUrl) throw new Error("DATABASE_URL is not set in .env.local.");
  if (!organizationId || !uuidPattern.test(organizationId)) {
    throw new Error("Set DEMO_ORGANIZATION_ID to the exact workspace UUID you intend to modify.");
  }
  if (!confirmed) {
    throw new Error("Set DEMO_DATA_CONFIRM=ALLOW_DEMO_DATA_MUTATION to confirm this data mutation.");
  }

  return { databaseUrl, organizationId };
}
