"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Plus, Users, UserCheck, Sparkles, CalendarDays, Handshake, UserX } from "lucide-react";
import { MetricCard } from "@/src/components/shared/metric-card";
import { EmptyState } from "@/src/components/shared/empty-state";
import { CustomerToolbar } from "@/src/components/customers/customer-toolbar";
import { CustomerTable } from "@/src/components/customers/customer-table";
import type { CustomerMetrics, CustomerRow } from "@/src/lib/supabase/customer-queries";
import type { CustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";
import { Button } from "../ui/button";

interface CustomersPageClientProps {
  metrics: CustomerMetrics;
  rows: CustomerRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  search: string;
  filterLookups: CustomerFilterLookups;
}

export function CustomersPageClient({
  metrics,
  rows,
  totalCount,
  page,
  pageSize,
  search,
  filterLookups,
}: CustomersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1">Customers</h1>
          <p className="text-body-sm text-text-muted">
            Every customer relationship across Optimus Megatron Cars, in one place.
          </p>
        </div>
       

        <Link href="/admin/customers/new">
          <Button variant="gradient" size="sm" leftIcon={<Plus />}>
            Add Customer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Customers"
          value={metrics.total}
          icon={<Users />}
          change={metrics.totalChange}
          trend={metrics.totalTrend}
        />
        <MetricCard label="Active Customers" value={metrics.active} icon={<UserCheck />} />
        <MetricCard label="New Today" value={metrics.newToday} icon={<Sparkles />} />
        <MetricCard label="New This Month" value={metrics.newThisMonth} icon={<CalendarDays />} />
        <MetricCard label="With Active Deals" value={metrics.withActiveDeals} icon={<Handshake />} />
        <MetricCard label="Inactive" value={metrics.inactive} icon={<UserX />} />
      </div>

      <CustomerToolbar resultCount={totalCount} filterLookups={filterLookups} />

      {metrics.total === 0 && !search ? (
        <EmptyState
          title="No customers yet"
          description="Add your first customer to start building relationships alongside your inventory."
          action={{
            label: "Add Customer",
            href: "/admin/customers/new",
          }}
        />
      ) : (
        <CustomerTable
          rows={rows}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onPageChange={(p) => updateParam("page", String(p))}
          onPageSizeChange={(size) => updateParam("pageSize", String(size))}
          searchQuery={search}
        />
      )}
    </div>
  );
}
