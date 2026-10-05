// The exact set of customer_activity.activity_type values that count as an
// auditable field/relationship change, per Sprint 3's Phase 18 brief — distinct
// from Activity's "everything that happened" feed, which shows all types.
export const AUDITABLE_ACTIVITY_TYPES = [
  "created",
  "profile_updated",
  "status_changed",
  "source_changed",
  "prm_changed",
  "tag_added",
  "tag_removed",
  "staff_assigned",
  "staff_reassigned",
  "vehicle_relation_added",
  "relationship_status_changed",
  "account_activated",
  "account_disabled",
  "archived",
  "restored",
] as const;

export function isAuditableActivity(activityType: string): boolean {
  return (AUDITABLE_ACTIVITY_TYPES as readonly string[]).includes(activityType);
}
