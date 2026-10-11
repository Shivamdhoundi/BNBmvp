// Fixed-point arithmetic: never sum currency using floating point.
export function minorUnits(value: string | number): bigint {
  const text = String(value);
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new Error("Invalid monetary amount");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace(/^-/, "").split(".");
  const units = BigInt(whole) * BigInt("100") + BigInt(fraction.padEnd(2, "0"));
  return negative ? -units : units;
}
export function displayMoney(units: bigint, currency: string): string {
  const absolute = units < BigInt("0") ? -units : units;
  return `${currency} ${units < BigInt("0") ? "-" : ""}${(absolute / BigInt("100")).toLocaleString("en-IN")}.${String(absolute % BigInt("100")).padStart(2, "0")}`;
}
