import Link from "next/link";
import { CalendarClock, CalendarPlus, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { InterestBadge } from "@/src/components/test-drives/interest-badge";
import { formatDateTimeFull } from "@/src/lib/utils/test-drive-format";
import type { TestDriveFeedbackLoad, TestDriveFollowUpLoad } from "@/src/lib/types/test-drive";

interface FeedbackCardProps {
  load: TestDriveFeedbackLoad;
  /** Whether the current user may add or change feedback. */
  canEdit: boolean;
  onEdit: () => void;
  followUps: TestDriveFollowUpLoad;
  /** Whether the current user may create a follow-up from this drive. */
  canCreateFollowUp: boolean;
  onCreateFollowUp: () => void;
}

function Block({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-body-sm text-text-primary font-medium">{label}</p>
      {value && value.trim() ? (
        <p className="bg-card-hover/50 text-body-sm text-text-primary rounded-md px-3 py-2 whitespace-pre-wrap">
          {value}
        </p>
      ) : (
        <p className="text-body-sm text-text-subtle">None.</p>
      )}
    </div>
  );
}

export function FeedbackCard({
  load,
  canEdit,
  onEdit,
  followUps,
  canCreateFollowUp,
  onCreateFollowUp,
}: FeedbackCardProps) {
  const feedback = load.status === "ok" ? load.feedback : null;

  // Newest first. A cancelled follow-up doesn't count: another can be created.
  const liveFollowUp =
    followUps.status === "ok" ? followUps.items.find((f) => f.status !== "Cancelled") : undefined;

  return (
    <section aria-label="Test drive feedback" className="surface-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-label">Feedback</p>
        {canEdit && load.status === "ok" && (
          <Button size="sm" variant="outline" leftIcon={<Pencil className="size-3.5" />} onClick={onEdit}>
            {feedback ? "Edit feedback" : "Add feedback"}
          </Button>
        )}
      </div>

      {load.status === "error" ? (
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          The feedback couldn&apos;t be loaded. Refresh the page to try again.
        </p>
      ) : !feedback ? (
        <p className="text-body-sm text-text-muted">No feedback has been recorded for this test drive.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {feedback.interest_level ? (
              <InterestBadge level={feedback.interest_level} />
            ) : (
              <span className="text-body-sm text-text-subtle">Interest level not recorded</span>
            )}

            {feedback.follow_up_required && (
              <span
                className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[var(--omc-status-text)]"
                style={
                  {
                    "--omc-status-raw": "#f59e0b",
                    backgroundColor: "#f59e0b1A",
                    borderColor: "#f59e0b66",
                  } as React.CSSProperties
                }
              >
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Follow-up needed
              </span>
            )}
          </div>

          <Block label="Staff feedback" value={feedback.staff_feedback} />
          <Block label="Customer feedback" value={feedback.customer_feedback} />
          <Block label="Recommended next step" value={feedback.next_step} />

          <div className="border-border text-caption text-text-subtle border-t pt-3">
            <p>
              Recorded{feedback.recorded_by_name ? ` by ${feedback.recorded_by_name}` : ""} ·{" "}
              <time dateTime={feedback.recorded_at}>{formatDateTimeFull(feedback.recorded_at)}</time>
            </p>
            {feedback.updated_at && (
              <p>
                Last edited{feedback.updated_by_name ? ` by ${feedback.updated_by_name}` : ""} ·{" "}
                <time dateTime={feedback.updated_at}>{formatDateTimeFull(feedback.updated_at)}</time>
              </p>
            )}
          </div>
        </>
      )}

      <div className="border-border flex flex-col gap-2 border-t pt-4">
        <p className="text-body-sm text-text-primary font-medium">Follow-up</p>

        {followUps.status === "error" ? (
          <p role="alert" className="text-body-sm text-red-500">
            The follow-ups couldn&apos;t be loaded. Refresh the page to try again.
          </p>
        ) : liveFollowUp ? (
          <p className="text-body-sm text-text-muted flex flex-wrap items-center gap-1.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden="true" />
            {liveFollowUp.type} · {liveFollowUp.status} ·{" "}
            <time dateTime={liveFollowUp.scheduled_at}>{formatDateTimeFull(liveFollowUp.scheduled_at)}</time>
            <Link
              href={`/admin/leads/${liveFollowUp.lead_id}`}
              className="text-primary-text hover:text-primary-hover ml-1"
            >
              Open the lead
            </Link>
          </p>
        ) : canCreateFollowUp ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-body-sm text-text-muted">
              {feedback?.follow_up_required
                ? "This drive was marked as needing a follow-up, and none has been scheduled yet."
                : "No follow-up has been scheduled from this drive."}
            </p>
            <Button
              size="sm"
              variant={feedback?.follow_up_required ? "primary" : "outline"}
              leftIcon={<CalendarPlus className="size-3.5" />}
              onClick={onCreateFollowUp}
            >
              Create follow-up
            </Button>
          </div>
        ) : (
          <p className="text-body-sm text-text-subtle">No follow-up has been scheduled from this drive.</p>
        )}
      </div>
    </section>
  );
}
