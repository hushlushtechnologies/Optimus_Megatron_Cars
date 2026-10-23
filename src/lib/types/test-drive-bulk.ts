export type BulkActionKind = "cancel" | "assign" | "archive" | "restore";

export interface BulkRowOutcome {
  id: string;
  number: string;
  /** Why it was skipped. Only set for skipped rows. */
  reason?: string;
}

export interface BulkResult {
  kind: BulkActionKind;
  requested: number;
  succeeded: BulkRowOutcome[];
  skipped: BulkRowOutcome[];
}

export interface BulkActionResponse {
  /** Set when nothing was attempted (no permission, bad input). */
  error: string | null;
  result: BulkResult | null;
}
