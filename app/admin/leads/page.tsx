import { cookies } from "next/headers";
import { getLeadMetrics, getLeadsForKanban, getLeadRows } from "@/src/lib/supabase/lead-queries";
import { getLeadFilterLookups, getLeadLostReasons } from "@/src/lib/supabase/lead-lookups";
import { parseLeadFilters } from "@/src/lib/utils/lead-filters";
import { LEAD_VIEW_COOKIE, type LeadView } from "@/src/lib/utils/lead-view";
import { LeadsPageClient } from "@/src/components/leads/leads-page-client";
import type { LeadLostReason } from "@/src/lib/types/lead";

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 25;
  const sort = params.sort ?? "newest";
  const search = params.q;
  const archived = params.archived === "true";
  const filters = parseLeadFilters(params);

  // The server knows the chosen view from a cookie, so it fetches only that
  // view's data instead of building both the board and the table every time.
  const view: LeadView = (await cookies()).get(LEAD_VIEW_COOKIE)?.value === "table" ? "table" : "kanban";

  const [metrics, filterLookups, kanbanData, tableData, lostReasons] = await Promise.all([
    getLeadMetrics(),
    getLeadFilterLookups(),
    view === "kanban" ? getLeadsForKanban({ search, sort, filters }) : Promise.resolve(null),
    view === "table"
      ? getLeadRows({ page, pageSize, search, sort, filters, archived })
      : Promise.resolve(null),
    view === "kanban" ? getLeadLostReasons() : Promise.resolve([]),
  ]);

  const resultCount = kanbanData
    ? Object.values(kanbanData.stageTotals).reduce((sum, n) => sum + n, 0)
    : (tableData?.totalCount ?? 0);

  return (
    <LeadsPageClient
      metrics={metrics}
      initialView={view}
      kanbanData={kanbanData}
      tableData={tableData}
      resultCount={resultCount}
      page={page}
      pageSize={pageSize}
      filterLookups={filterLookups}
      lostReasons={lostReasons as LeadLostReason[]}
    />
  );
}
