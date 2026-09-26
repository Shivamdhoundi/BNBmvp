/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export type PropertyData = {
  id: string;
  name: string;
  slug: string;
  property_type: string;
  status: string;
  city: string;
  state: string;
  base_price: string;
  management_commission_percent: string;
  created_at: string;
  owners?: {
    id: string;
    legal_name: string;
  } | null | any; // using any to bypass the weird array inference by supabase-js
};

export const columns: ColumnDef<PropertyData>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-1 hover:text-slate-900"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Property
          <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
        </button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <Link href={`/dashboard/properties/${row.original.id}`} className="font-semibold text-slate-900 hover:underline">
            {row.original.name}
          </Link>
          <span className="text-xs text-slate-500">{row.original.slug}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "owners.legal_name",
    id: "owner",
    header: "Owner",
    cell: ({ row }) => {
      // Supabase sometimes returns array for 1:1 if not explicitly cast, handle both
      const ownerObj = Array.isArray(row.original.owners) ? row.original.owners[0] : row.original.owners;
      return ownerObj ? (
        <span className="text-slate-700">{ownerObj.legal_name}</span>
      ) : (
        <span className="text-slate-400 italic">No owner</span>
      );
    },
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (row) => `${row.city}, ${row.state}`,
    cell: ({ row }) => {
      return (
        <span className="text-slate-700">
          {row.original.city}, {row.original.state}
        </span>
      );
    },
  },
  {
    accessorKey: "property_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("property_type") as string;
      return <span className="capitalize text-slate-700">{type.replace(/_/g, " ")}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const getStatusColor = (s: string) => {
        switch (s) {
          case "active":
            return "bg-emerald-100 text-emerald-700";
          case "onboarding":
            return "bg-blue-100 text-blue-700";
          case "draft":
            return "bg-slate-100 text-slate-700";
          case "paused":
          case "inactive":
          case "maintenance":
            return "bg-amber-100 text-amber-700";
          default:
            return "bg-slate-100 text-slate-700";
        }
      };

      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusColor(status)}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "base_price",
    header: "Base Price",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("base_price"));
      return <span className="text-slate-900 font-medium">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>;
    },
  },
  {
    accessorKey: "management_commission_percent",
    header: "Commission",
    cell: ({ row }) => {
      const percent = parseFloat(row.getValue("management_commission_percent"));
      return <span className="text-slate-700">{percent}%</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span className="text-slate-500 whitespace-nowrap">{format(date, "MMM d, yyyy")}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/properties/${row.original.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Link>
      );
    },
  },
];
