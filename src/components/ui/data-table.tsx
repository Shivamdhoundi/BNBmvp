"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  error?: Error | null;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  bulkActions?: {
    label: string;
    icon?: React.ElementType;
    onClick: (selectedRows: TData[]) => void;
    variant?: "default" | "destructive";
  }[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  loading = false,
  error = null,
  emptyStateTitle = "No results found",
  emptyStateDescription = "Try adjusting your filters or search query.",
  bulkActions = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [showColumnsMenu, setShowColumnsMenu] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  return (
    <div className="w-full space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          {searchKey ? (
            <input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:h-10 sm:w-[300px] sm:text-sm"
            />
          ) : (
             <input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:h-10 sm:w-[300px] sm:text-sm"
            />
          )}
        </div>
        
        <div className="flex w-full items-center justify-end space-x-2 sm:w-auto">
          {selectedRows.length > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2 mr-2 border-r border-slate-200 pr-4">
              <span className="text-sm text-slate-500 mr-2">{selectedRows.length} selected</span>
              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => action.onClick(selectedRows)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 h-9 px-3",
                    action.variant === "destructive" 
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 focus:ring-rose-500" 
                      : "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 focus:ring-slate-900"
                  )}
                >
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* View Options */}
          <div className="relative">
            <button
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 h-10 px-4 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              View
            </button>
            {showColumnsMenu && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg shadow-black/5">
                <div className="px-2 py-1.5 text-sm font-semibold text-slate-900">Toggle columns</div>
                <div className="h-px bg-slate-100 my-1" />
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .map((column) => {
                    return (
                      <label
                        key={column.id}
                        className="flex items-center space-x-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="capitalize text-slate-700">{column.id.replace(/_/g, " ")}</span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <p className="text-xs text-slate-400 sm:hidden">Swipe horizontally to view all columns.</p>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-100">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="h-12 px-4 align-middle font-medium select-none whitespace-nowrap"
                        style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : (
                          <div 
                            className={cn(
                              "flex items-center gap-2",
                              header.column.getCanSort() ? "cursor-pointer select-none hover:text-slate-900 transition-colors" : ""
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ChevronDown className="h-4 w-4 rotate-180" />,
                              desc: <ChevronDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
                      <p className="text-sm">Loading data...</p>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-rose-500 space-y-2">
                      <p className="font-medium text-sm">Failed to load data</p>
                      <p className="text-xs text-rose-400">{error.message}</p>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-slate-50/50 transition-colors group data-[state=selected]:bg-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                      <p className="font-medium text-slate-900">{emptyStateTitle}</p>
                      <p className="text-sm">{emptyStateDescription}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
        <div className="hidden flex-1 text-sm text-slate-500 sm:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-600 sm:text-sm">Rows</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-9 w-[64px] rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>{pageSize}</option>
              ))}
            </select>
          </div>
          <div className="text-xs font-medium text-slate-700 sm:text-sm">
            Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 lg:flex"><span className="sr-only">Go to first page</span><ChevronsLeft className="h-4 w-4" /></button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 sm:h-9 sm:w-9"><span className="sr-only">Go to previous page</span><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 sm:h-9 sm:w-9"><span className="sr-only">Go to next page</span><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50 lg:flex"><span className="sr-only">Go to last page</span><ChevronsRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
