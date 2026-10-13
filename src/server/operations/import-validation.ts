import { parseCsv } from "@/lib/csv";
import { createGuestSchema } from "@/server/guests/validation";

export type GuestImportRow = { first_name: string; last_name: string; email: string; phone: string };
export function parseGuestImport(csv: string): GuestImportRow[] {
  const [header, ...rows] = parseCsv(csv);
  const expected = ["first_name", "last_name", "email", "phone"];
  if (!header || header.length !== 4 || !header.every((h, i) => h.trim() === expected[i])) throw new Error("Use the headers: first_name,last_name,email,phone (in that order).");
  if (rows.length === 0) throw new Error("Add at least one guest row.");
  return rows.map((row, index) => {
    if (row.length !== 4) throw new Error(`Row ${index + 2}: expected four columns.`);
    const parsed = createGuestSchema.safeParse({ firstName: row[0], lastName: row[1], email: row[2], phone: row[3], identityVerified: false });
    if (!parsed.success) throw new Error(`Row ${index + 2}: ${parsed.error.issues[0].message}`);
    return { first_name: parsed.data.firstName, last_name: parsed.data.lastName, email: parsed.data.email?.toLowerCase() ?? "", phone: parsed.data.phone ?? "" };
  });
}
