import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAutomationDraft } from "@/lib/automation-draft";

const mocks = vi.hoisted(() => ({ context: vi.fn(), client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/server/auth/context", () => ({ requireOrganizationContext: mocks.context }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveAutomationDraft } from "./actions";

function form(version = 0) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ ...defaultAutomationDraft, version })) {
    if (typeof value === "boolean") { if (value) data.set(key, "on"); }
    else data.set(key, String(value));
  }
  return data;
}

describe("automation draft action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.context.mockResolvedValue({ role: "admin", organization: { id: "trusted-workspace" } });
  });
  it.each(["owner", "vendor", "operations"])("rejects %s before accessing storage", async role => {
    mocks.context.mockResolvedValue({ role, organization: { id: "trusted-workspace" } });
    expect((await saveAutomationDraft({}, form())).error).toMatch(/administrators/);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("rejects bad input before accessing storage", async () => {
    const input = form(); input.set("reminderHours", "0");
    expect((await saveAutomationDraft({}, input)).error).toBeTruthy();
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("uses authenticated organization, not a submitted organization", async () => {
    const query = { select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }) };
    const insert = vi.fn().mockReturnValue(query);
    mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });
    const input = form(); input.set("organization_id", "attacker-workspace"); input.set("active", "true");
    expect((await saveAutomationDraft({}, input)).success).toMatch(/No messages sent/);
    expect(insert.mock.calls[0][0].organization_id).toBe("trusted-workspace");
    expect(insert.mock.calls[0][0]).not.toHaveProperty("active");
  });
  it("detects stale updates and does not claim success or leak errors", async () => {
    const query = { eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue(query) }) });
    expect((await saveAutomationDraft({}, form(3))).error).toMatch(/not saved/);
    expect(query.eq).toHaveBeenCalledWith("organization_id", "trusted-workspace");
    expect(query.eq).toHaveBeenCalledWith("version", 3);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
