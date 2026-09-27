import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

// Target YOUR real workspace (sdhoundiyal.41@gmail.com)
const TARGET_ORG_ID = "7579a20b-b0d1-43fc-9c1f-6f5cf9af4655";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

function daysFromNow(n) {
  const d = new Date();
  d.setHours(15, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

async function main() {
  const [membership] = await sql`
    SELECT user_id FROM organization_members
    WHERE organization_id = ${TARGET_ORG_ID} AND status = 'active'
    ORDER BY created_at ASC LIMIT 1
  `;
  if (!membership) {
    console.error("Target org has no active member. Aborting.");
    await sql.end();
    process.exit(1);
  }
  const orgId = TARGET_ORG_ID;
  const userId = membership.user_id;
  console.log("Seeding YOUR organization:", orgId);

  const owners = [
    { legal_name: "Rohan Malhotra", email: "rohan.malhotra@example.com", phone: "+91 98110 22334" },
    { legal_name: "Ananya Kapoor", email: "ananya.kapoor@example.com", phone: "+91 98110 55667" },
    { legal_name: "Vikram Sethi", email: "vikram.sethi@example.com", phone: "+91 98110 88990" },
  ];
  const ownerIds = [];
  for (const o of owners) {
    const [row] = await sql`
      INSERT INTO owners (organization_id, legal_name, email, phone, is_active)
      VALUES (${orgId}, ${o.legal_name}, ${o.email}, ${o.phone}, true) RETURNING id`;
    ownerIds.push(row.id);
  }
  console.log(`Inserted ${ownerIds.length} owners`);

  const properties = [
    { name: "The Grand Pavilion Villa", slug: `grand-pavilion-villa-${Date.now()}`, type: "villa", addr: "12 Golf Course Road", base: "24500", bedrooms: "4", bathrooms: "4", maxGuests: 8 },
    { name: "Skyline Luxury Penthouse 4B", slug: `skyline-penthouse-4b-${Date.now()}`, type: "apartment", addr: "Tower 7, Cyber City Sector 24", base: "18000", bedrooms: "3", bathrooms: "3", maxGuests: 6 },
    { name: "Boutique Heritage Suite", slug: `boutique-heritage-suite-${Date.now()}`, type: "serviced_apartment", addr: "DLF Phase 5", base: "12500", bedrooms: "2", bathrooms: "2", maxGuests: 4 },
    { name: "Stone Veranda Farmhouse", slug: `stone-veranda-farmhouse-${Date.now()}`, type: "house", addr: "Sohna Road Greens", base: "32000", bedrooms: "5", bathrooms: "5", maxGuests: 10 },
  ];
  const propertyIds = [];
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const [row] = await sql`
      INSERT INTO properties (organization_id, owner_id, name, slug, property_type, status, address_line_1, city, state, base_price, created_by)
      VALUES (${orgId}, ${ownerIds[i % ownerIds.length]}, ${p.name}, ${p.slug}, ${p.type}::public.property_type, 'active', ${p.addr}, 'Gurugram', 'Haryana', ${p.base}, ${userId})
      RETURNING id`;
    propertyIds.push(row.id);
    await sql`
      INSERT INTO property_units (organization_id, property_id, name, bedrooms, bathrooms, max_guests)
      VALUES (${orgId}, ${row.id}, 'Main unit', ${p.bedrooms}, ${p.bathrooms}, ${p.maxGuests})`;
  }
  console.log(`Inserted ${propertyIds.length} properties (+ units)`);

  const guests = [
    { first: "Aarav", last: "Sharma", email: "aarav.sharma@example.com", phone: "+91 99100 11223", verified: true },
    { first: "Diya", last: "Nair", email: "diya.nair@example.com", phone: "+91 99100 44556", verified: true },
    { first: "Kabir", last: "Singh", email: "kabir.singh@example.com", phone: "+91 99100 77889", verified: false },
    { first: "Meera", last: "Iyer", email: "meera.iyer@example.com", phone: "+91 99100 33445", verified: true },
    { first: "Arjun", last: "Reddy", email: "arjun.reddy@example.com", phone: "+91 99100 66778", verified: false },
  ];
  const guestIds = [];
  for (const g of guests) {
    const [row] = await sql`
      INSERT INTO guests (organization_id, first_name, last_name, email, phone, identity_verified)
      VALUES (${orgId}, ${g.first}, ${g.last}, ${g.email}, ${g.phone}, ${g.verified}) RETURNING id`;
    guestIds.push(row.id);
  }
  console.log(`Inserted ${guestIds.length} guests`);

  const bookings = [
    { p: 0, g: 0, in: -2, out: 3, status: "confirmed", guests: 4, price: "122500", source: "airbnb" },
    { p: 1, g: 1, in: 1, out: 5, status: "confirmed", guests: 3, price: "72000", source: "direct" },
    { p: 2, g: 2, in: 4, out: 6, status: "pending", guests: 2, price: "25000", source: "booking_com" },
    { p: 3, g: 3, in: 7, out: 12, status: "confirmed", guests: 8, price: "160000", source: "direct" },
    { p: 0, g: 4, in: 10, out: 13, status: "pending", guests: 5, price: "73500", source: "makemytrip" },
    { p: 1, g: 0, in: -10, out: -6, status: "completed", guests: 2, price: "72000", source: "airbnb" },
    { p: 2, g: 3, in: 14, out: 17, status: "confirmed", guests: 3, price: "37500", source: "direct" },
  ];
  let count = 0;
  for (const b of bookings) {
    await sql`
      INSERT INTO bookings (organization_id, property_id, guest_id, check_in_date, check_out_date, status, total_guests, total_price, booking_source)
      VALUES (${orgId}, ${propertyIds[b.p]}, ${guestIds[b.g]}, ${daysFromNow(b.in)}, ${daysFromNow(b.out)}, ${b.status}::public.booking_status, ${b.guests}, ${b.price}, ${b.source})`;
    count++;
  }
  console.log(`Inserted ${count} bookings`);
  console.log("\nDemo data added to YOUR workspace. Refresh the dashboard.");
  await sql.end();
}

main().catch(async (e) => {
  console.error("Seed failed:", e.message);
  await sql.end();
  process.exit(1);
});
