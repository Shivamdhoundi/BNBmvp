import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { requireOrganizationContext } from "@/server/auth/context";
import { listTasks, operationOptions } from "@/server/operations/service";
import type { TaskKind } from "@/server/operations/validation";
import { createTaskAction, progressTaskAction, scheduleTaskAction } from "@/app/dashboard/operations/actions";
import { ActionForm } from "./action-form";
import { Field, inputClass, ModulePage, PageLinks, pageNumber } from "./shared";

export async function TaskPage({ kind, searchParams }: { kind: TaskKind; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await requireOrganizationContext();
  if (!can(context.role, "tasks:read")) return <ModulePage title="Operations" description="Your role cannot access internal tasks.">{null}</ModulePage>;
  const page = pageNumber((await searchParams).page);
  const manage = can(context.role, "tasks:manage");
  const [{ tasks, total }, options] = await Promise.all([
    listTasks(context.organization.id, kind, page), operationOptions(context.organization.id, manage, context.role === "vendor"),
  ]);
  const title = kind === "cleaning" ? "Cleaning" : "Maintenance";
  const path = `/dashboard/${kind}`;
  return <ModulePage title={title} description="Schedule property work, assign an active team member, and track completion. Dates are calendar dates at the property. Vendors see only their assigned tasks.">
    {manage && <details className="rounded-xl border border-slate-200 bg-white p-5">
      <summary className="cursor-pointer font-semibold">Create {kind} task</summary>
      <div className="mt-4"><ActionForm action={createTaskAction} label="Create task" refreshAfterCreate={path}>
        <input type="hidden" name="id" value={randomUUID()} /><input type="hidden" name="kind" value={kind} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Property"><select required name="propertyId" className={inputClass} defaultValue=""><option value="" disabled>Select property</option>{options.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Task title"><input required name="title" maxLength={160} className={inputClass} /></Field>
          <Field label="Due date"><input required type="date" name="dueDate" min="2000-01-01" max="2100-12-31" className={inputClass} /></Field>
          <Field label="Priority"><select name="priority" defaultValue="normal" className={inputClass}><option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option></select></Field>
          <Field label="Assigned team member"><select name="assignedTo" className={inputClass}><option value="">Unassigned</option>{options.assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        </div>
        <Field label="Instructions"><textarea name="notes" maxLength={4000} rows={3} className={inputClass} /></Field>
        {options.properties.length === 0 && <p className="text-sm text-amber-700">Create a property before adding tasks.</p>}
      </ActionForm></div>
    </details>}
    <div className="grid gap-4 xl:grid-cols-2">{tasks.map(task => <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4"><h2 className="font-semibold text-slate-900">{task.title}</h2><span className="rounded bg-slate-100 px-2 py-1 text-xs">{task.priority}</span></div>
      <p className="mt-2 text-sm text-slate-600">{options.properties.find(p => p.id === task.property_id)?.name ?? "Assigned property"} · Due {task.due_date}</p>
      <p className="mt-1 text-sm text-slate-600">{task.status.replaceAll("_", " ")} · {task.assigned_to ? options.assignees.find(a => a.id === task.assigned_to)?.name ?? (manage ? "Assigned member" : "Assigned to you") : "Unassigned"}</p>
      {manage && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Edit assignment / schedule</summary>
        <div className="mt-3"><ActionForm key={task.version} action={scheduleTaskAction} label="Save scheduling">
          <input type="hidden" name="id" value={task.id} /><input type="hidden" name="version" value={task.version} />
          <Field label="Title"><input name="title" required maxLength={160} defaultValue={task.title} className={inputClass} /></Field>
          <Field label="Due date"><input name="dueDate" type="date" required min="2000-01-01" max="2100-12-31" defaultValue={task.due_date} className={inputClass} /></Field>
          <Field label="Priority"><select name="priority" defaultValue={task.priority} className={inputClass}>{["low", "normal", "urgent"].map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
          <Field label="Assignee"><select name="assignedTo" defaultValue={task.assigned_to ?? ""} className={inputClass}><option value="">Unassigned</option>{options.assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        </ActionForm></div>
      </details>}
      <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Update progress</summary>
        <div className="mt-3"><ActionForm key={task.version} action={progressTaskAction} label="Save progress">
          <input type="hidden" name="id" value={task.id} /><input type="hidden" name="version" value={task.version} />
          <Field label="Status"><select name="status" defaultValue={task.status} className={inputClass}><option value="open">Open</option><option value="in_progress">In progress</option><option value="completed">Completed</option>{manage && <option value="cancelled">Cancelled</option>}</select></Field>
          <Field label="Instructions / completion notes"><textarea name="notes" defaultValue={task.notes} maxLength={4000} rows={3} className={inputClass} /></Field>
        </ActionForm></div>
      </details>
    </article>)}</div>
    {tasks.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-sm text-slate-600">No {kind} tasks on this page.</p>}
    <PageLinks page={page} total={total} path={path} />
  </ModulePage>;
}
