import type { TestDriveStatus } from "@/src/lib/types/test-drive";
import type { TestDrivePermissionName, TestDrivePermissions } from "@/src/lib/utils/test-drive-permissions";

export type TestDriveActionKey =
  | "approve"
  | "reject"
  | "assign_staff"
  | "reassign_staff"
  | "edit"
  | "reschedule"
  | "cancel"
  | "check_in"
  | "complete"
  | "no_show";

export interface TestDriveActionMeta {
  key: TestDriveActionKey;
  label: string;
  /** Shown as a tooltip on the button, and as the menu caption in the overflow menu. */
  tooltip: string;
  variant: "default" | "outline" | "destructive";
}

export const TEST_DRIVE_ACTION_META: Record<TestDriveActionKey, TestDriveActionMeta> = {
  approve: {
    key: "approve",
    label: "Approve",
    tooltip: "Confirm this request and reserve the vehicle and staff member.",
    variant: "default",
  },
  reject: {
    key: "reject",
    label: "Reject",
    tooltip: "Decline this request. A reason is required.",
    variant: "destructive",
  },
  assign_staff: {
    key: "assign_staff",
    label: "Assign Staff",
    tooltip: "Choose who will host this test drive.",
    variant: "outline",
  },
  reassign_staff: {
    key: "reassign_staff",
    label: "Reassign Staff",
    tooltip: "Hand this test drive to a different staff member. Their availability is checked.",
    variant: "outline",
  },
  edit: {
    key: "edit",
    label: "Edit",
    tooltip: "Change notes, staff or schedule details.",
    variant: "outline",
  },
  reschedule: {
    key: "reschedule",
    label: "Reschedule",
    tooltip: "Move to a new date or time. Availability is checked again.",
    variant: "outline",
  },
  cancel: {
    key: "cancel",
    label: "Cancel",
    tooltip: "Cancel this appointment. A reason is required.",
    variant: "destructive",
  },
  check_in: {
    key: "check_in",
    label: "Check In",
    tooltip: "Record that the customer has arrived.",
    variant: "default",
  },
  complete: {
    key: "complete",
    label: "Complete",
    tooltip: "Record that the test drive took place and capture feedback.",
    variant: "default",
  },
  no_show: {
    key: "no_show",
    label: "Mark No Show",
    tooltip: "The customer did not arrive. Available once the appointment time has passed.",
    variant: "destructive",
  },
};

/**
 * Which actions make sense for a test drive right now. The list is ordered by
 * importance: the header shows the first two as buttons and tucks the rest
 * into a menu. This mirrors the database's rules, but it only decides what to
 * SHOW. The server and the database still enforce what is allowed.
 *
 * - Approve and reject need approval rights (can_approve_test_drives in the database).
 * - A test drive with no host is offered "Assign Staff", one with a host "Reassign Staff".
 */
/** Which permission each action needs. The server and the database check the very same ones. */
export const ACTION_PERMISSION: Record<TestDriveActionKey, TestDrivePermissionName> = {
  approve: "approve",
  reject: "approve",
  assign_staff: "assign",
  reassign_staff: "assign",
  edit: "edit",
  reschedule: "reschedule",
  cancel: "cancel",
  check_in: "checkIn",
  complete: "complete",
  no_show: "complete",
};

/**
 * Which actions make sense for a test drive right now AND are allowed for this
 * person. The list is ordered by importance: the header shows the first two as
 * buttons and tucks the rest into a menu. This only decides what to SHOW. The
 * server and the database still enforce what is allowed.
 */
export function getAvailableActions(
  status: TestDriveStatus,
  options: { isCheckedIn: boolean; hasStaff: boolean; permissions: TestDrivePermissions },
): TestDriveActionKey[] {
  const assignKey: TestDriveActionKey = options.hasStaff ? "reassign_staff" : "assign_staff";

  let candidates: TestDriveActionKey[];

  switch (status) {
    case "Pending":
      candidates = ["approve", "reject", assignKey, "edit", "cancel"];
      break;
    case "Approved":
    case "Rescheduled":
      // Once the customer has arrived, moving the appointment or calling it a
      // no show no longer makes sense. A different host still can.
      candidates = options.isCheckedIn
        ? ["complete", assignKey, "edit", "cancel"]
        : ["check_in", "reschedule", assignKey, "edit", "complete", "no_show", "cancel"];
      break;
    default:
      candidates = [];
  }

  return candidates.filter((key) => options.permissions[ACTION_PERMISSION[key]]);
}

/**
 * Which sprint phase makes each action real. Used for honest placeholder
 * messages until then. Only edit, reschedule, check in and complete are ever
 * shown now: the rest are live.
 */
export const TEST_DRIVE_ACTION_ARRIVES_IN: Record<TestDriveActionKey, string> = {
  approve: "Phase 8",
  reject: "Phase 8",
  cancel: "Phase 8",
  no_show: "Phase 8",
  assign_staff: "Phase 9",
  reassign_staff: "Phase 9",
  edit: "Phase 11",
  reschedule: "Phase 11",
  check_in: "Phase 13",
  complete: "Phase 14",
};
