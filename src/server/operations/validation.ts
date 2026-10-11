import { z } from "zod";

export const calendarDate = z.iso.date().refine((value) => value >= "2000-01-01" && value <= "2100-12-31", "Choose a date between 2000 and 2100.");
export const taskKind = z.enum(["cleaning", "maintenance"]);
export const taskStatus = z.enum(["open", "in_progress", "completed", "cancelled"]);
export const taskInput = z.object({
  id: z.uuid(),
  propertyId: z.uuid(),
  kind: taskKind,
  title: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(4000),
  priority: z.enum(["low", "normal", "urgent"]),
  dueDate: calendarDate,
  assignedTo: z.union([z.uuid(), z.literal("")]),
});
export const progressInput = z.object({
  id: z.uuid(),
  version: z.coerce.number().int().min(1).max(2147483646),
  status: taskStatus,
  notes: z.string().trim().max(4000),
});
export const scheduleInput = taskInput.pick({ id: true, title: true, priority: true, dueDate: true, assignedTo: true }).extend({
  version: z.coerce.number().int().min(1).max(2147483646),
});
export const expenseInput = z.object({
  id: z.uuid(),
  propertyId: z.uuid(),
  description: z.string().trim().min(1).max(300),
  category: z.enum(["cleaning", "maintenance", "utilities", "supplies", "other"]),
  amount: z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/, "Enter a positive amount with at most two decimal places.")
    .refine((value) => Number(value) > 0, "Amount must be greater than zero."),
  incurredOn: calendarDate,
});
export const voidExpenseInput = z.object({
  id: z.uuid(),
  version: z.coerce.number().int().min(1).max(2147483646),
  voidReason: z.string().trim().min(1).max(300),
});
export const reportRange = z.object({ from: calendarDate, to: calendarDate }).refine(
  ({ from, to }) => to >= from && Date.parse(to) - Date.parse(from) <= 366 * 86400000,
  "Choose a valid range of at most 367 days.",
);
export type TaskKind = z.infer<typeof taskKind>;
