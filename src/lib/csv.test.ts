import { describe, expect, it } from "vitest";
import { csvCell, parseCsv, toCsv } from "./csv";
import { parseGuestImport } from "@/server/operations/import-validation";
describe("CSV data boundaries", () => {
  it.each(["=SUM(1)", "+123", "-10", "@cmd", "  =cmd", "\tformula"])("neutralizes formula %s", value => expect(csvCell(value)).toMatch(/^"'/));
  it("round trips commas, quotes, Unicode and newlines", () => {
    const csv = toCsv(["name", "notes"], [{ name: 'A, "B"', notes: "नमस्ते\nsecond line" }]);
    expect(parseCsv(csv)).toEqual([["name", "notes"], ['A, "B"', "नमस्ते\nsecond line"]]);
  });
  it.each(['a,"unclosed', '"closed"extra,b', 'unquoted"quote,b'])("rejects malformed CSV %s", value => expect(() => parseCsv(value)).toThrow());
  it("bounds size and row count", () => {
    expect(() => parseCsv("x".repeat(131073))).toThrow(/128 KB/);
    expect(() => parseCsv("a,b\n".repeat(202))).toThrow(/200 records/);
  });
  it("validates guest header and each row", () => {
    expect(() => parseGuestImport("name,email\nA,a@example.com")).toThrow(/headers/);
    expect(() => parseGuestImport("first_name,last_name,email,phone\nA,B,invalid,123")).toThrow(/Row 2/);
    expect(parseGuestImport('first_name,last_name,email,phone\nA,B,A@Example.com,+123')).toEqual([{ first_name: "A", last_name: "B", email: "a@example.com", phone: "+123" }]);
  });
});
