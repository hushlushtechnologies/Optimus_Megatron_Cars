"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateFollowUpDialog } from "@/src/components/test-drives/follow-up/create-follow-up-dialog";
import { Archive, ArrowLeft } from "lucide-react";
import { FeedbackCard } from "@/src/components/test-drives/detail/feedback-card";
import { Tabs, TabsList, Tab, TabPanel } from "@/src/components/ui/tabs";
import { TestDriveDetailHeader } from "@/src/components/test-drives/test-drive-detail-header";
import { TestDriveAssignmentCard } from "@/src/components/test-drives/test-drive-assignment-card";
import { TestDriveCheckInCard } from "@/src/components/test-drives/test-drive-check-in-card";
import { TestDriveTimeline } from "@/src/components/test-drives/test-drive-timeline";
import { useTestDriveActions } from "@/src/components/test-drives/actions/use-test-drive-actions";
import { StatusCallout } from "@/src/components/test-drives/detail/status-callout";
import { DetailCustomerCard } from "@/src/components/test-drives/detail/customer-card";
import { DetailVehicleCard } from "@/src/components/test-drives/detail/vehicle-card";
import { hasAnyTestDrivePermission, type TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";
import { NotesCard } from "@/src/components/test-drives/detail/notes-card";
import { AppointmentInfoCard } from "@/src/components/test-drives/detail/appointment-info-card";
import { ScheduleHistoryList } from "@/src/components/test-drives/detail/schedule-history-list";
import { getAvailableActions } from "@/src/lib/utils/test-drive-actions";
import type {
  TestDriveDetailData,
  TestDriveFeedbackLoad,
  TestDriveFollowUpLoad,
  TestDriveStatus,
  TestDriveSummary,
} from "@/src/lib/types/test-drive";

const CAN_CHANGE_HOST: TestDriveStatus[] = ["Pending", "Approved", "Rescheduled"];

interface TestDriveDetailClientProps {
  data: TestDriveDetailData;
  /** Whether the current user may change test drives at all. */
  permissions: TestDrivePermissions;
  /** The drive's feedback, or the fact that it couldn't be loaded. */
  feedback: TestDriveFeedbackLoad;
  /** The follow-ups created from this drive, or the fact that they couldn't be loaded. */
  followUps: TestDriveFollowUpLoad;
}

export function TestDriveDetailClient({
  data,
  permissions,
  feedback,
  followUps,
}: TestDriveDetailClientProps) {
  const { detail } = data;
  const actions = useTestDriveActions();

  const router = useRouter();
  const [followUpOpen, setFollowUpOpen] = useState(false);

  // The page holds no copy of the data. After any action the dialogs refresh
  // the route, and this component simply receives the new data.
  const summary: TestDriveSummary = {
    id: detail.id,
    test_drive_number: detail.test_drive_number,
    status: detail.status,
    scheduled_start: detail.scheduled_start,
    scheduled_end: detail.scheduled_end,
    duration_minutes: detail.duration_minutes,
    customer: {
      id: detail.customer_id,
      full_name: detail.customer_name,
      customer_number: detail.customer_number,
      phone: detail.customer_phone,
    },
    vehicle: {
      id: detail.car_id,
      display_title: detail.vehicle_title,
      brand_name: detail.brand_name,
      stock_id: detail.stock_id,
    },
    location_name: detail.location_name,
    assigned_staff_id: detail.assigned_staff_id,
    assigned_staff_name: detail.staff_name,
    lead_id: detail.lead_id,
    lead_number: detail.lead_number,
    request_source_name: detail.request_source_name,
    checked_in_at: detail.checked_in_at,
    created_at: detail.created_at,
  };

  const allowedActions = getAvailableActions(detail.status, {
    isCheckedIn: !!detail.checked_in_at,
    hasStaff: !!detail.assigned_staff_id,
    permissions,
  });

  const canChangeHost = permissions.assign && CAN_CHANGE_HOST.includes(detail.status);
  const hasHost = !!detail.assigned_staff_id;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/test-drives"
        className="text-body-sm text-text-muted hover:text-text-primary focus-visible:ring-primary inline-flex items-center gap-1.5 self-start rounded focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Test Drives
      </Link>

      {detail.archived_at && (
        <p
          role="status"
          className="border-border bg-card-hover/60 text-body-sm text-text-muted flex items-center gap-2 rounded-md border px-3 py-2"
        >
          <Archive className="size-4 shrink-0" aria-hidden="true" />
          This test drive is archived. It&apos;s kept for the record and can&apos;t be changed.
        </p>
      )}

      <TestDriveDetailHeader
        testDrive={summary}
        allowedActions={allowedActions}
        onAction={(key) => actions.request(key, detail)}
      />

      {!hasAnyTestDrivePermission(permissions) && (
        <p role="note" className="text-body-sm text-text-muted">
          You can view this test drive, but you don&apos;t have permission to change it.
        </p>
      )}

      <StatusCallout
        detail={detail}
        statusChanges={data.statusChanges}
        scheduleChanges={data.scheduleChanges}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
        {/* On a phone the host and check-in cards come first: they're what staff need while a customer is at the showroom. */}
        <div className="order-2 flex flex-col gap-6 xl:order-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DetailCustomerCard detail={detail} />
            <DetailVehicleCard detail={detail} />
          </div>

          <NotesCard customerNotes={detail.customer_notes} internalNotes={detail.internal_notes} />

          {detail.status === "Completed" && (
            <FeedbackCard
              load={feedback}
              canEdit={permissions.complete && !detail.archived_at}
              onEdit={() => actions.editFeedback(detail)}
              followUps={followUps}
              canCreateFollowUp={permissions.complete && !detail.archived_at}
              onCreateFollowUp={() => setFollowUpOpen(true)}
            />
          )}

          <section aria-label="History" className="surface-card p-5">
            <Tabs defaultTab="activity">
              <TabsList>
                <Tab id="activity">Activity</Tab>
                <Tab id="appointment-history">Appointment history</Tab>
              </TabsList>

              <TabPanel id="activity">
                <div className="pt-4">
                  {data.timeline === null ? (
                    <p
                      role="alert"
                      className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
                    >
                      The activity couldn&apos;t be loaded. Refresh the page to try again.
                    </p>
                  ) : (
                    <TestDriveTimeline entries={data.timeline} />
                  )}
                </div>
              </TabPanel>

              <TabPanel id="appointment-history">
                <div className="pt-4">
                  <ScheduleHistoryList
                    changes={data.scheduleChanges}
                    current={{ start: detail.scheduled_start, durationMinutes: detail.duration_minutes }}
                  />
                </div>
              </TabPanel>
            </Tabs>
          </section>
        </div>

        <div className="order-1 flex flex-col gap-6 xl:order-2">
          <TestDriveAssignmentCard
            staffName={detail.staff_name}
            assignedByName={data.assignedBy?.name ?? null}
            assignedAt={data.assignedBy?.at ?? null}
            canChange={canChangeHost}
            onChange={() => actions.request(hasHost ? "reassign_staff" : "assign_staff", detail)}
            onViewHistory={() => actions.viewAssignmentHistory(detail)}
          />

          <TestDriveCheckInCard
            status={detail.status}
            checkedInAt={detail.checked_in_at}
            checkedInByName={detail.checked_in_by_name}
            canCheckIn={permissions.checkIn}
            onCheckIn={() => actions.request("check_in", detail)}
          />

          <AppointmentInfoCard detail={detail} />
        </div>
      </div>

      {actions.dialogs}

      {followUpOpen && (
        <CreateFollowUpDialog
          testDriveId={detail.id}
          onClose={() => setFollowUpOpen(false)}
          onDone={() => {
            setFollowUpOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
