import { describe, expect, it } from "vitest";
import { calendarDate, expenseInput, progressInput, reportRange, taskInput } from "./validation";
const id = "123e4567-e89b-42d3-a456-426614174000";
describe("operational input", () => {
  it("accepts task scheduling with an unassigned member", () => {
    expect(taskInput.safeParse({ id, propertyId: id, kind: "cleaning", title: " Turnover ", notes: "", priority: "normal", dueDate: "2030-01-01", assignedTo: "" }).success).toBe(true);
  });
  it.each(["2030-02-30", "1999-12-31", "2101-01-01", "tomorrow"])("rejects invalid calendar date %s", value => {
    expect(calendarDate.safeParse(value).success).toBe(false);
  });
  it.each(["0", "-1", "1.001", "1e3", "NaN", "10000000000", ""])("rejects invalid amount %s", amount => {
    expect(expenseInput.safeParse({ id, propertyId: id, description: "Soap", category: "supplies", amount, incurredOn: "2030-01-01" }).success).toBe(false);
  });
  it("accepts exact decimal expenses", () => {
    expect(expenseInput.parse({ id, propertyId: id, description: "Soap", category: "supplies", amount: "0.10", incurredOn: "2030-01-01" }).amount).toBe("0.10");
  });
  it("requires a positive version on updates", () => {
    expect(progressInput.safeParse({ id, version: "0", status: "completed", notes: "Done" }).success).toBe(false);
  });
  it("limits reports and rejects reversed ranges", () => {
    expect(reportRange.safeParse({ from: "2030-01-01", to: "2030-01-31" }).success).toBe(true);
    expect(reportRange.safeParse({ from: "2030-01-31", to: "2030-01-01" }).success).toBe(false);
    expect(reportRange.safeParse({ from: "2030-01-01", to: "2032-01-01" }).success).toBe(false);
  });
});
