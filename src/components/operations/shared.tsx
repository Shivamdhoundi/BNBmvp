import Link from "next/link";
import type { ReactNode } from "react";

export const inputClass = "mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus-visible:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-200";
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}</label>;
}
export function ModulePage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="space-y-6 pb-12 sm:space-y-8"><header className="border-b border-slate-200 pb-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700">Operations workspace</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p></header>{children}</div>;
}
export function PageLinks({ page, total, path }: { page: number; total: number; path: string }) {
  return <nav aria-label="Pagination" className="flex flex-wrap gap-4 text-sm"><span>{total} records · Page {page} of {Math.max(1, Math.ceil(total / 25))}</span>{page > 1 && <Link className="underline" href={`${path}?page=${page - 1}`}>Previous</Link>}{page * 25 < total && <Link className="underline" href={`${path}?page=${page + 1}`}>Next</Link>}</nav>;
}
export function pageNumber(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{1,6}$/.test(value) ? Math.max(1, Number(value)) : 1;
}
