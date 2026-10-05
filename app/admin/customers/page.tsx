import { getCustomerMetrics, getCustomerRows } from "@/src/lib/supabase/customer-queries";

import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

import { parseCustomerFilters } from "@/src/lib/utils/customer-filters";

import { CustomersPageClient } from "@/src/components/customers/customers-page-client";

interface CustomersPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;

  const page = Number(params.page) || 1;

  const pageSize = Number(params.pageSize) || 25;

  const filters = parseCustomerFilters(params);

  /* =========================================================
     ARCHIVED VIEW
  ========================================================= */

  const isArchivedView = params.archived === "true";

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const [metrics, { rows, totalCount }, filterLookups] = await Promise.all([
    getCustomerMetrics({
      archived: isArchivedView,
    }),

    getCustomerRows({
      search: params.q,

      sort: params.sort,

      page,

      pageSize,

      filters,

      archived: isArchivedView,
    }),

    getCustomerFilterLookups(),
  ]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <CustomersPageClient
      metrics={metrics}
      rows={rows}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      search={params.q ?? ""}
      filterLookups={filterLookups}
      tagOptions={filterLookups.tags}
      staffOptions={filterLookups.staff}
      isArchivedView={isArchivedView}
    />
  );
}
