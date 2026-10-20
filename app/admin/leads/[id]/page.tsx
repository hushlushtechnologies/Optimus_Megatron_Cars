import { notFound } from "next/navigation";
import { getLeadDetail, getActiveLeadStages } from "@/src/lib/supabase/lead-detail-queries";
import {
  getStaffOptions,
  getLeadTagOptions,
  getLeadLostReasons,
  getLeadFutureActions,
  getLeadSourceOptions,
} from "@/src/lib/supabase/lead-lookups";
import { getTestDrivesForPanel } from "@/src/lib/supabase/test-drive-panel-queries";
import { currentUserTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import { LeadDetailPageClient } from "@/src/components/leads/lead-detail-page-client";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  const [
    lead,
    stages,
    staffOptions,
    allTags,
    lostReasons,
    futureActions,
    sources,
    testDrives,
    testDrivePermissions,
  ] = await Promise.all([
    getLeadDetail(id),
    getActiveLeadStages(),
    getStaffOptions(),
    getLeadTagOptions(),
    getLeadLostReasons(),
    getLeadFutureActions(),
    getLeadSourceOptions(),
    getTestDrivesForPanel({ leadId: id }),
    currentUserTestDrivePermissions(),
  ]);

  if (!lead) notFound();

  return (
    <LeadDetailPageClient
      initialLead={lead}
      stages={stages}
      staffOptions={staffOptions}
      allTags={allTags}
      lostReasons={lostReasons}
      futureActions={futureActions}
      sources={sources}
      testDrives={testDrives}
      testDrivePermissions={testDrivePermissions}
    />
  );
}
