import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

async function main() {
  const orgRows = await sql`
    SELECT o.id AS org_id
    FROM organizations o
    JOIN organization_members m ON m.organization_id = o.id AND m.status = 'active'
    ORDER BY o.created_at ASC
    LIMIT 1
  `;

  if (orgRows.length === 0) {
    console.error("No organization found. Nothing to clear.");
    await sql.end();
    process.exit(1);
  }

  const orgId = orgRows[0].org_id;
  console.log("Clearing demo data for organization:", orgId);

  // Delete in FK-safe order. property_units and bookings cascade from properties,
  // but we delete bookings explicitly first to be safe with guest FKs.
  const b = await sql`DELETE FROM bookings WHERE organization_id = ${orgId} RETURNING id`;
  console.log(`Deleted ${b.length} bookings`);

  const pu = await sql`DELETE FROM property_units WHERE organization_id = ${orgId} RETURNING id`;
  console.log(`Deleted ${pu.length} property units`);

  const p = await sql`DELETE FROM properties WHERE organization_id = ${orgId} RETURNING id`;
  console.log(`Deleted ${p.length} properties`);

  const g = await sql`DELETE FROM guests WHERE organization_id = ${orgId} RETURNING id`;
  console.log(`Deleted ${g.length} guests`);

  const o = await sql`DELETE FROM owners WHERE organization_id = ${orgId} RETURNING id`;
  console.log(`Deleted ${o.length} owners`);

  console.log("\nDemo data cleared. The organization and your account remain intact.");
  await sql.end();
}

main().catch(async (err) => {
  console.error("Clear failed:", err.message);
  await sql.end();
  process.exit(1);
});
