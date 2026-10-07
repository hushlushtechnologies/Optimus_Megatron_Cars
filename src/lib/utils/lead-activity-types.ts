// The subset of lead_activities.activity_type values that count as a
// compliance-relevant field or relationship change — distinct from the
// Activity tab's "everything that happened" feed. Same split Sprint 3
// Phase 18 drew for Customers: notes and follow-up logistics are real
// activity, not the kind of thing an audit trail needs to isolate.
export const AUDITABLE_LEAD_ACTIVITY_TYPES = [
  "created",
  "stage_changed",
  "staff_assigned",
  "staff_reassigned",
  "temperature_changed",
  "tag_added",
  "tag_removed",
  "won",
  "lost",
] as const;

export function isAuditableLeadActivity(activityType: string): boolean {
  return (AUDITABLE_LEAD_ACTIVITY_TYPES as readonly string[]).includes(activityType);
}
