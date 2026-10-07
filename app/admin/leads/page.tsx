import { getLeadMetrics, getLeadsForKanban, getLeadRows } from "@/src/lib/supabase/lead-queries";

import { getLeadFilterLookups } from "@/src/lib/supabase/lead-lookups";

import { parseLeadFilters } from "@/src/lib/utils/lead-filters";

import { LeadsPageClient } from "@/src/components/leads/leads-page-client";

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;

  const page = Number(params.page) || 1;

  const pageSize = Number(params.pageSize) || 25;

  const sort = params.sort ?? "newest";

  const search = params.q;

  const filters = parseLeadFilters(params);

  const isArchivedView = params.archived === "true";

  const [metrics, kanbanData, { rows: tableRows, totalCount: tableTotalCount }, filterLookups] =
    await Promise.all([
      getLeadMetrics(),

      getLeadsForKanban({
        search,
        sort,
        filters,
      }),

      getLeadRows({
        page,
        pageSize,
        search,
        sort,
        filters,
        archived: isArchivedView,
      }),

      getLeadFilterLookups(),
    ]);

  return (
    <LeadsPageClient
      metrics={metrics}
      kanbanData={kanbanData}
      tableRows={tableRows}
      tableTotalCount={tableTotalCount}
      page={page}
      pageSize={pageSize}
      filterLookups={filterLookups}
      isArchivedView={isArchivedView}
    />
  );
}
