"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { TestDrivePanelList } from "@/src/components/test-drives/panel/test-drive-panel-list";
import { CreateFollowUpDialog } from "@/src/components/test-drives/follow-up/create-follow-up-dialog";
import type { TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import type { TestDrivePanelItem, TestDrivePanelLoad } from "@/src/lib/types/test-drive";

interface LeadTestDrivesTabProps {
  load: TestDrivePanelLoad;
  leadId: string;
  leadIsOpen: boolean;
  permissions: TestDrivePermissions;
}

export function LeadTestDrivesTab({ load, leadId, leadIsOpen, permissions }: LeadTestDrivesTabProps) {
  const router = useRouter();
  const [followUpFor, setFollowUpFor] = useState<TestDrivePanelItem | null>(null);

  const canSchedule = permissions.create && leadIsOpen;

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-text-muted">Every test drive linked to this lead.</p>

        {canSchedule && (
          <Link
            href={`/admin/test-drives/new?leadId=${leadId}`}
            className="bg-primary text-body-sm hover:bg-primary-hover inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-[#0b1220] transition-colors"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Schedule test drive
          </Link>
        )}
      </div>

      <TestDrivePanelList
        load={load}
        emptyTitle="No test drives for this lead yet"
        emptyDescription={
          canSchedule
            ? "Schedule one and it appears here, with its result once it has happened."
            : "Test drives linked to this lead appear here."
        }
        onCreateFollowUp={permissions.complete ? setFollowUpFor : undefined}
      />

      {followUpFor && (
        <CreateFollowUpDialog
          testDriveId={followUpFor.id}
          onClose={() => setFollowUpFor(null)}
          onDone={() => {
            setFollowUpFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
