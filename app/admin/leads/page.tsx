import { getLeadMetrics, getLeadsForKanban, getLeadRows } from "@/src/lib/supabase/lead-queries";
import { LeadsPageClient } from "@/src/components/leads/leads-page-client";

interface LeadsPageProps {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 25;

  const [metrics, kanbanData, { rows: tableRows, totalCount: tableTotalCount }] = await Promise.all([
    getLeadMetrics(),
    getLeadsForKanban(),
    getLeadRows({ page, pageSize }),
  ]);

  return (
    <LeadsPageClient
      metrics={metrics}
      kanbanData={kanbanData}
      tableRows={tableRows}
      tableTotalCount={tableTotalCount}
      page={page}
      pageSize={pageSize}
    />
  );
}
