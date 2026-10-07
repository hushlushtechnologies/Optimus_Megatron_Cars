"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Tabs, TabsList, Tab, TabPanel } from "@/src/components/ui/tabs";
import { CommunicationsTab } from "@/src/components/leads/profile-tabs/communications-tab";
import { LeadDetailHeader } from "@/src/components/leads/lead-detail-header";
import { MoveStageDialog } from "@/src/components/leads/move-stage-dialog";
import { ManageLeadTagsDialog } from "@/src/components/leads/manage-lead-tags-dialog";
import { AssignStaffDialog } from "@/src/components/leads/assign-staff-dialog";
import { AssignmentHistoryDialog } from "@/src/components/leads/assignment-history-dialog";
import { FollowUpDialog } from "@/src/components/leads/follow-up-dialog";
import { ActivityTab } from "@/src/components/leads/profile-tabs/activity-tab";
import { HistoryTab } from "@/src/components/leads/profile-tabs/history-tab";
import { OverviewTab } from "@/src/components/leads/profile-tabs/overview-tab";
import { CustomerTab } from "@/src/components/leads/profile-tabs/customer-tab";
import { VehicleTab } from "@/src/components/leads/profile-tabs/vehicle-tab";
import { FollowUpsTab } from "@/src/components/leads/profile-tabs/follow-ups-tab";
import { NotesTab } from "@/src/components/leads/profile-tabs/notes-tab";
import { MarkWonDialog } from "@/src/components/leads/mark-won-dialog";
import { MarkLostDialog } from "@/src/components/leads/mark-lost-dialog";
import { FutureModuleActions } from "@/src/components/leads/future-module-actions";
import type { LeadFutureAction } from "@/src/lib/supabase/lead-lookups";
import { useRouter } from "next/navigation";
import type { LeadLostReason } from "@/src/lib/types/lead";

import type { LeadStage, LeadSummary, LeadTag, LeadTemperature } from "@/src/lib/types/lead";

import type { StaffOption } from "@/src/lib/supabase/lead-lookups";

interface LeadDetailPageClientProps {
  initialLead: LeadSummary;
  stages: LeadStage[];
  staffOptions: StaffOption[];
  allTags: LeadTag[];
  lostReasons: LeadLostReason[];
  futureActions: LeadFutureAction[];
}

export function LeadDetailPageClient({
  initialLead,
  stages,
  staffOptions,
  allTags,
  lostReasons,
  futureActions,
}: LeadDetailPageClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);

  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [assignmentHistoryOpen, setAssignmentHistoryOpen] = useState(false);
  const [scheduleFollowUpOpen, setScheduleFollowUpOpen] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [markWonOpen, setMarkWonOpen] = useState(false);
  const [markLostOpen, setMarkLostOpen] = useState(false);

  // Tabs is uncontrolled and only accepts an initial default tab.
  // Changing this value remounts Tabs so actions such as "Add Note"
  // can open a particular tab.
  const [initialTab, setInitialTab] = useState("overview");

  return (
    <div className="flex flex-col gap-6">
      <LeadDetailHeader
        lead={lead}
        onEdit={() => toast.info("Lead editing arrives in a future phase")}
        onAssignStaff={() => setAssignStaffOpen(true)}
        onMoveStage={() => setMoveStageOpen(true)}
        onScheduleFollowUp={() => setScheduleFollowUpOpen(true)}
        onAddNote={() => setInitialTab("notes")}
        onAddTag={() => setManageTagsOpen(true)}
        onMarkWon={() => setMarkWonOpen(true)}
        onMarkLost={() => setMarkLostOpen(true)}
      />

      <FutureModuleActions actions={futureActions} />

      <Tabs key={initialTab} defaultTab={initialTab}>
        <TabsList>
          <Tab id="overview">Overview</Tab>
          <Tab id="customer">Customer</Tab>
          <Tab id="vehicle">Vehicle</Tab>
          <Tab id="follow-ups">Follow-Ups</Tab>
          <Tab id="notes">Notes</Tab>
          <Tab id="communications">Communications</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="history">History</Tab>
        </TabsList>

        <TabPanel id="overview">
          <OverviewTab
            lead={lead}
            onViewAssignmentHistory={() => setAssignmentHistoryOpen(true)}
            onTemperatureChanged={(next: LeadTemperature) =>
              setLead((prev) => ({
                ...prev,
                temperature: next,
              }))
            }
            onManageTags={() => setManageTagsOpen(true)}
          />
        </TabPanel>

        <TabPanel id="customer">
          <CustomerTab lead={lead} />
        </TabPanel>

        <TabPanel id="vehicle">
          <VehicleTab lead={lead} />
        </TabPanel>

        <TabPanel id="follow-ups">
          <FollowUpsTab leadId={lead.id} />
        </TabPanel>

        <TabPanel id="notes">
          <NotesTab leadId={lead.id} />
        </TabPanel>

        <TabPanel id="communications">
          <CommunicationsTab leadId={lead.id} customerId={lead.customer.id} />
        </TabPanel>

        <TabPanel id="activity">
          <ActivityTab leadId={lead.id} />
        </TabPanel>

        <TabPanel id="history">
          <HistoryTab leadId={lead.id} />
        </TabPanel>
      </Tabs>

      <MoveStageDialog
        isOpen={moveStageOpen}
        onClose={() => setMoveStageOpen(false)}
        leadId={lead.id}
        currentStageId={lead.stage.id}
        stages={stages}
        onMoved={(newStageId) => {
          const newStage = stages.find((stage) => stage.id === newStageId);

          if (newStage) {
            setLead((prev) => ({
              ...prev,
              stage: newStage,
            }));
          }
        }}
      />

      <AssignStaffDialog
        isOpen={assignStaffOpen}
        onClose={() => setAssignStaffOpen(false)}
        leadId={lead.id}
        currentStaffId={lead.assigned_staff_id}
        staffOptions={staffOptions}
        onAssigned={(staffId, staffName) =>
          setLead((prev) => ({
            ...prev,
            assigned_staff_id: staffId,
            assigned_staff_name: staffName,
          }))
        }
      />

      <AssignmentHistoryDialog
        isOpen={assignmentHistoryOpen}
        onClose={() => setAssignmentHistoryOpen(false)}
        leadId={lead.id}
      />

      <FollowUpDialog
        isOpen={scheduleFollowUpOpen}
        onClose={() => setScheduleFollowUpOpen(false)}
        leadId={lead.id}
        mode="create"
      />

      <ManageLeadTagsDialog
        isOpen={manageTagsOpen}
        onClose={() => setManageTagsOpen(false)}
        leadId={lead.id}
        allTags={allTags}
        currentTagIds={lead.tags.map((tag) => tag.id)}
        onSaved={(newTags) =>
          setLead((prev) => ({
            ...prev,
            tags: newTags,
          }))
        }
      />

      <MarkWonDialog
        isOpen={markWonOpen}
        onClose={() => setMarkWonOpen(false)}
        leadId={lead.id}
        onMarked={() => router.refresh()}
      />

      <MarkLostDialog
        isOpen={markLostOpen}
        onClose={() => setMarkLostOpen(false)}
        leadId={lead.id}
        reasons={lostReasons}
        onMarked={() => router.refresh()}
      />
    </div>
  );
}
