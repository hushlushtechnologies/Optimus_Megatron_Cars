import type { TestDriveStatus } from "@/src/lib/types/test-drive";
import type { BulkActionKind } from "@/src/lib/types/test-drive-bulk";

export const MAX_BULK_SELECTION = 50;

/** Which statuses each bulk action can apply to. The server re-checks every row. */
export const BULK_ELIGIBLE_STATUSES: Record<BulkActionKind, TestDriveStatus[]> = {
  cancel: ["Pending", "Approved", "Rescheduled"],
  assign: ["Pending", "Approved", "Rescheduled"],
  archive: ["Completed", "Cancelled", "Rejected", "No Show"],
  restore: ["Pending", "Approved", "Rescheduled", "Completed", "Cancelled", "Rejected", "No Show"],
};

export const BULK_CANCEL_SUGGESTIONS = [
  "Customer asked to cancel",
  "Vehicle isn't available",
  "Staff isn't available",
  "Couldn't reach the customer",
];
