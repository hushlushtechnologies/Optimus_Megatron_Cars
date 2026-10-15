// The subset of lead_activities.activity_type values that count as a
// compliance-relevant field or relationship change, distinct from the
// Activity tab's "everything that happened" feed. Notes, communications and
// follow-up logistics are real activity but not audit-trail material.
export const AUDITABLE_LEAD_ACTIVITY_TYPES = [
  "created",
  "stage_changed",
  "staff_assigned",
  "staff_reassigned",
  "temperature_changed",
  "tag_added",
  "tag_removed",
  "vehicle_changed",
  "lead_updated",
  "won",
  "lost",
  "archived",
  "restored",
] as const;

export function isAuditableLeadActivity(activityType: string): boolean {
  return (AUDITABLE_LEAD_ACTIVITY_TYPES as readonly string[]).includes(activityType);
}
