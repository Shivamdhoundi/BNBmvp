"use client";

import { useActionState, type ReactNode } from "react";
import type { OperationState } from "@/app/dashboard/operations/actions";

export function ActionForm({ action, children, label, refreshAfterCreate, confirmMessage }: {
  action: (state: OperationState, form: FormData) => Promise<OperationState>;
  children: ReactNode; label: string; refreshAfterCreate?: string; confirmMessage?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" onSubmit={(event) => {
      if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
    }}>
      <fieldset disabled={pending || Boolean(refreshAfterCreate && state.success)} className="space-y-4 disabled:opacity-60">
        {children}
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : label}</button>
      </fieldset>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">{state.success} {refreshAfterCreate && <a href={refreshAfterCreate} className="underline">Add another</a>}</p>}
    </form>
  );
}
