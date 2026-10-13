import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ context: vi.fn(), client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/server/auth/context", () => ({ requireOrganizationContext: mocks.context }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createTaskAction, progressTaskAction, createExpenseAction, voidExpenseAction, scheduleTaskAction } from "./actions";
const id = "123e4567-e89b-42d3-a456-426614174000";
function form(values: Record<string, string>) { const data = new FormData(); for (const [k,v] of Object.entries(values)) data.set(k,v); return data; }
describe("operation actions", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.context.mockResolvedValue({ role: "operations", organization: { id: "org" }, user: { id: "actor" } }); });
  it.each([createTaskAction, createExpenseAction, voidExpenseAction, scheduleTaskAction])("denies vendor management before querying", async action => {
    mocks.context.mockResolvedValue({ role: "vendor" }); expect((await action({}, new FormData())).error).toBeTruthy(); expect(mocks.client).not.toHaveBeenCalled();
  });
  it("validates task input before querying", async () => {
    expect((await createTaskAction({}, new FormData())).error).toBeTruthy(); expect(mocks.client).not.toHaveBeenCalled();
  });
  it("binds task creation to the authenticated workspace and actor", async () => {
    const insert=vi.fn().mockResolvedValue({ error: null }); mocks.client.mockResolvedValue({ from: vi.fn().mockReturnValue({ insert }) });
    const result=await createTaskAction({},form({ id, organizationId:"attacker", createdBy:"attacker", propertyId:id,kind:"cleaning",title:"Turnover",notes:"",dueDate:"2030-01-01",priority:"normal",assignedTo:"" }));
    expect(result.success).toBeTruthy(); expect(insert).toHaveBeenCalledWith(expect.objectContaining({ organization_id:"org",created_by:"actor",assigned_to:null }));
  });
  it("reports failed and stale updates instead of claiming success",async()=>{
    const builder={ update:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),select:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data:null,error:null}) };
    mocks.client.mockResolvedValue({ from:vi.fn().mockReturnValue(builder) });
    const result=await progressTaskAction({},form({ id,version:"3",status:"completed",notes:"Done" }));
    expect(result.error).toBeTruthy(); expect(builder.eq).toHaveBeenCalledWith("organization_id","org"); expect(builder.eq).toHaveBeenCalledWith("version",3); expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("keeps expense values as decimal strings",async()=>{
    const insert=vi.fn().mockResolvedValue({error:null}); mocks.client.mockResolvedValue({from:vi.fn().mockReturnValue({insert})});
    await createExpenseAction({},form({id,propertyId:id,description:"Soap",category:"supplies",amount:"0.10",incurredOn:"2030-01-01"}));
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({amount:"0.10",organization_id:"org"}));
  });
});
