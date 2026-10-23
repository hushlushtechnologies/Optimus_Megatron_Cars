"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cancelTestDriveAction } from "@/app/admin/test-drives/actions";
import { assignTestDriveStaffAction } from "@/app/admin/test-drives/assignment-actions";
import {
  NOT_FOUND_MESSAGE,
  STALE_MESSAGE,
  beginTestDriveAction,
  loadTestDriveForAction,
  statusErrorFor,
  type SupabaseServerClient,
} from "@/src/lib/supabase/test-drive-action-helpers";
import { isEligibleTestDriveHost } from "@/src/lib/supabase/test-drive-permissions";
import { recordTestDriveAudit } from "@/src/lib/supabase/test-drive-audit";
import { mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import { BULK_ELIGIBLE_STATUSES, MAX_BULK_SELECTION } from "@/src/lib/utils/test-drive-bulk";
import type { BulkActionKind, BulkActionResponse, BulkRowOutcome } from "@/src/lib/types/test-drive-bulk";

const idsSchema = z
  .array(z.string().uuid())
  .min(1, "Select at least one test drive.")
  .max(MAX_BULK_SELECTION, `Select no more than ${MAX_BULK_SELECTION} test drives at a time.`);

const cancelSchema = z.object({
  ids: idsSchema,
  reason: z
    .string()
    .trim()
    .min(3, "Please give a reason (at least 3 characters).")
    .max(500, "Keep the reason under 500 characters."),
});

const assignSchema = z.object({ ids: idsSchema, staffId: z.string().uuid("Choose a host.") });
const idsOnlySchema = z.object({ ids: idsSchema });

const GENERIC_ROW_ERROR = "This test drive couldn't be updated.";

type RowOutcome = { ok: true } | { ok: false; reason: string };
type LoadedDrive = NonNullable<Awaited<ReturnType<typeof loadTestDriveForAction>>>;

interface RunContext {
  supabase: SupabaseServerClient;
  userId: string;
  /** Extra facts for the audit row. Counts and settings only. */
  auditDetail?: Record<string, unknown>;
}

async function runRows(
  kind: BulkActionKind,
  ids: string[],
  ctx: RunContext,
  perRow: (drive: LoadedDrive) => Promise<RowOutcome>,
): Promise<BulkActionResponse> {
  const unique = [...new Set(ids)];
  const succeeded: BulkRowOutcome[] = [];
  const skipped: BulkRowOutcome[] = [];

  // One at a time: each row is checked against the latest state, and a slow
  // row never races another one for the same vehicle or host.
  for (const id of unique) {
    try {
      const drive = await loadTestDriveForAction(ctx.supabase, id);
      if (!drive) {
        skipped.push({ id, number: "Unknown", reason: NOT_FOUND_MESSAGE });
        continue;
      }
      const outcome = await perRow(drive);
      if (outcome.ok) succeeded.push({ id, number: drive.test_drive_number });
      else skipped.push({ id, number: drive.test_drive_number, reason: outcome.reason });
    } catch (error) {
      console.error(`bulk ${kind} row error:`, error);
      skipped.push({ id, number: "Unknown", reason: GENERIC_ROW_ERROR });
    }
  }

  await recordTestDriveAudit(ctx.supabase, {
    userId: ctx.userId,
    kind: `bulk_${kind}`,
    rowCount: succeeded.length,
    detail: {
      requested: unique.length,
      succeeded: succeeded.map((row) => row.number),
      skipped: skipped.length,
      ...ctx.auditDetail,
    },
  });

  revalidatePath("/admin/test-drives");
  return { error: null, result: { kind, requested: unique.length, succeeded, skipped } };
}

export async function bulkCancelTestDrivesAction(input: unknown): Promise<BulkActionResponse> {
  const start = await beginTestDriveAction("cancel");
  if (!start.ok) return { error: start.error, result: null };

  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the details.", result: null };
  }
  const { ids, reason } = parsed.data;

  return runRows(
    "cancel",
    ids,
    { supabase: start.supabase, userId: start.userId, auditDetail: { reason } },
    async (drive) => {
      const problem = statusErrorFor(drive, BULK_ELIGIBLE_STATUSES.cancel);
      if (problem) return { ok: false, reason: problem };
      const result = await cancelTestDriveAction({ id: drive.id, reason });
      return result.error ? { ok: false, reason: result.error } : { ok: true };
    },
  );
}

export async function bulkAssignTestDriveStaffAction(input: unknown): Promise<BulkActionResponse> {
  const start = await beginTestDriveAction("assign");
  if (!start.ok) return { error: start.error, result: null };

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the details.", result: null };
  }
  const { ids, staffId } = parsed.data;

  if (!(await isEligibleTestDriveHost(start.supabase, staffId))) {
    return { error: "That person can't host test drives.", result: null };
  }

  return runRows(
    "assign",
    ids,
    { supabase: start.supabase, userId: start.userId, auditDetail: { host_id: staffId } },
    async (drive) => {
      const problem = statusErrorFor(drive, BULK_ELIGIBLE_STATUSES.assign);
      if (problem) return { ok: false, reason: problem };
      if (drive.assigned_staff_id === staffId) {
        return { ok: false, reason: "This person already hosts it." };
      }
      const result = await assignTestDriveStaffAction({
        id: drive.id,
        staffId,
        expectedStaffId: drive.assigned_staff_id,
      });
      return result.error ? { ok: false, reason: result.error } : { ok: true };
    },
  );
}

export async function bulkArchiveTestDrivesAction(input: unknown): Promise<BulkActionResponse> {
  // The database trigger asks for "edit" when archived_at changes, so the same permission is used here.
  const start = await beginTestDriveAction("edit");
  if (!start.ok) return { error: start.error, result: null };

  const parsed = idsOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the details.", result: null };
  }
  const { supabase } = start;

  return runRows("archive", parsed.data.ids, { supabase, userId: start.userId }, async (drive) => {
    if (drive.archived_at) return { ok: false, reason: "Already archived." };
    if (!BULK_ELIGIBLE_STATUSES.archive.includes(drive.status)) {
      return {
        ok: false,
        reason: `It is ${drive.status.toLowerCase()}. Only finished test drives can be archived.`,
      };
    }

    const { data: updated, error } = await supabase
      .from("test_drives")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", drive.id)
      .eq("status", drive.status)
      .is("archived_at", null)
      .select("id");

    if (error) {
      console.error("bulkArchiveTestDrivesAction error:", error);
      return { ok: false, reason: mapTestDriveDbError(error) };
    }
    if (!updated || updated.length === 0) return { ok: false, reason: STALE_MESSAGE };
    return { ok: true };
  });
}

export async function bulkRestoreTestDrivesAction(input: unknown): Promise<BulkActionResponse> {
  const start = await beginTestDriveAction("edit");
  if (!start.ok) return { error: start.error, result: null };

  const parsed = idsOnlySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the details.", result: null };
  }
  const { supabase } = start;

  return runRows("restore", parsed.data.ids, { supabase, userId: start.userId }, async (drive) => {
    if (!drive.archived_at) return { ok: false, reason: "It isn't archived." };

    const { data: updated, error } = await supabase
      .from("test_drives")
      .update({ archived_at: null })
      .eq("id", drive.id)
      .not("archived_at", "is", null)
      .select("id");

    if (error) {
      console.error("bulkRestoreTestDrivesAction error:", error);
      return { ok: false, reason: mapTestDriveDbError(error) };
    }
    if (!updated || updated.length === 0) return { ok: false, reason: STALE_MESSAGE };
    return { ok: true };
  });
}
