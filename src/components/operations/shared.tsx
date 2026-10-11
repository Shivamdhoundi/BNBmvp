import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass = "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
}
export function ModulePage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="space-y-6 p-4 sm:p-8"><header><h1 className="text-2xl font-bold text-slate-900">{title}</h1><p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p></header>{children}</div>;
}
export function PageLinks({ page, total, path }: { page: number; total: number; path: string }) {
  return <nav aria-label="Pagination" className="flex flex-wrap gap-4 text-sm"><span>{total} records · Page {page} of {Math.max(1, Math.ceil(total / 25))}</span>{page > 1 && <Link className="underline" href={`${path}?page=${page - 1}`}>Previous</Link>}{page * 25 < total && <Link className="underline" href={`${path}?page=${page + 1}`}>Next</Link>}</nav>;
}
export function pageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1;
}
