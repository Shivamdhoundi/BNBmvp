import { describe, expect, it } from "vitest";
import { displayMoney, minorUnits } from "./money";
describe("fixed-point money", () => {
  it("sums decimals without rounding errors", () => expect(minorUnits("0.10") + minorUnits("0.20")).toBe(BigInt("30")));
  it("supports negative differences and large aggregates", () => {
    expect(displayMoney(minorUnits("-123.45"), "INR")).toBe("INR -123.45");
    expect(minorUnits("9999999999999999.99")).toBe(BigInt("999999999999999999"));
  });
  it.each(["NaN", "1.001", "1e9", "Infinity"])("rejects %s", value => expect(() => minorUnits(value)).toThrow());
});
