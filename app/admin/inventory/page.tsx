import Link from "next/link";
import { Plus, Car, CheckCircle2, Clock, PackageCheck, Sparkles, FileEdit } from "lucide-react";
import {
  getInventoryMetrics,
  getInventoryCars,
  getFilterLookups,
} from "@/src/lib/supabase/inventory-queries";
import { Button } from "@/src/components/ui/button";
import { getAddCarLookups } from "@/src/lib/supabase/inventory-lookups";
import { parseInventoryFilters } from "@/src/lib/utils/inventory-filters";
import { MetricCard } from "@/src/components/shared/metric-card";
import { InventoryToolbar } from "@/src/components/inventory/inventory-toolbar";
import { InventoryViewSwitcher } from "@/src/components/inventory/inventory-view-switcher";
import { EmptyState } from "@/src/components/shared/empty-state";

interface InventoryPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 25;
  const isArchivedView = params.archived === "true";
  const filters = parseInventoryFilters(params);

  const [metrics, { rows, totalCount }, addCarLookups, filterLookups] = await Promise.all([
    getInventoryMetrics(),
    getInventoryCars({
      search: params.q,
      sort: params.sort,
      page,
      pageSize,
      archived: isArchivedView,
      filters,
    }),
    getAddCarLookups(),
    getFilterLookups(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h1">Inventory</h1>
          <p className="text-body-sm text-text-muted">
            Manage every vehicle across all Optimus Megatron Cars locations.
          </p>
        </div>
        <Link href="/admin/inventory/new">
          <Button variant="gradient" size="sm" leftIcon={<Plus />}>
            Add Car
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total Cars"
          value={metrics.total}
          icon={<Car />}
          change={metrics.totalChange}
          trend={metrics.totalTrend}
        />
        <MetricCard label="Available" value={metrics.available} icon={<CheckCircle2 />} />
        <MetricCard label="Reserved" value={metrics.reserved} icon={<Clock />} />
        <MetricCard label="Sold" value={metrics.sold} icon={<PackageCheck />} />
        <MetricCard label="Coming Soon" value={metrics.comingSoon} icon={<Sparkles />} />
        <MetricCard label="Draft" value={metrics.draft} icon={<FileEdit />} />
      </div>

      <InventoryToolbar resultCount={totalCount} filterLookups={filterLookups} />

      {metrics.total === 0 && !params.q && !isArchivedView ? (
        <EmptyState
          icon="CarFront"
          title="No vehicles in inventory"
          description="Add your first vehicle to start building and managing your inventory."
          action={{
            label: "Add vehicle",
            href: "/admin/inventory/new",
          }}
        />
      ) : (
        <InventoryViewSwitcher
          rows={rows}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          isArchivedView={isArchivedView}
          availabilityStatuses={addCarLookups.availabilityStatuses}
          collections={addCarLookups.collections}
        />
      )}
    </div>
  );
}
