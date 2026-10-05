import { createClient } from "@/src/lib/supabase/server";
import { AUDITABLE_ACTIVITY_TYPES } from "@/src/lib/utils/customer-activity-types";

/* =========================================================
   TYPES
========================================================= */

export interface CustomerAuditEntry {
  id: string;
  customerId: string;
  customerName: string;
  activityType: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  changedByName: string;
  changedAt: string;
}

interface CustomerRelation {
  full_name: string;
}

interface RawCustomerActivityRow {
  id: string;
  customer_id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;

  customer: CustomerRelation | CustomerRelation[] | null;
}

interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

/* =========================================================
   RECENT CUSTOMER ACTIVITY
========================================================= */

/**
 * Recent auditable activity across ALL customers — not scoped
 * to one profile.
 *
 * Built in Sprint 3 Phase 18 as groundwork for a future
 * sitewide Audit Logs module.
 */
export async function getRecentCustomerActivity(limit = 20): Promise<CustomerAuditEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_activity")
    .select(
      `
        id,
        customer_id,
        activity_type,
        description,
        old_value,
        new_value,
        changed_by,
        changed_at,
        customer:customer_profiles(
          full_name
        )
      `,
    )
    .in("activity_type", AUDITABLE_ACTIVITY_TYPES as unknown as string[])
    .order("changed_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    console.error(
      `[getRecentCustomerActivity]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
    );

    return [];
  }

  const rows = (data ?? []) as unknown as RawCustomerActivityRow[];

  if (rows.length === 0) {
    return [];
  }

  /* =========================================================
     CHANGED-BY USER IDS
  ========================================================= */

  const userIds = new Set<string>();

  for (const row of rows) {
    if (row.changed_by) {
      userIds.add(row.changed_by);
    }
  }

  /* =========================================================
     STAFF / PROFILE NAMES
  ========================================================= */

  let profiles: ProfileNameRow[] = [];

  if (userIds.size > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", Array.from(userIds));

    if (profileError) {
      console.error(
        `[getRecentCustomerActivity:profiles]
code: ${profileError.code ?? "unknown"}
message: ${profileError.message ?? "unknown"}
details: ${profileError.details ?? "none"}
hint: ${profileError.hint ?? "none"}`,
      );
    }

    profiles = (profileData ?? []) as ProfileNameRow[];
  }

  const nameOf = (id: string | null): string => {
    if (!id) {
      return "System";
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  /* =========================================================
     FINAL AUDIT ROWS
  ========================================================= */

  return rows.map((row): CustomerAuditEntry => {
    const customer = normalizeRelation(row.customer);

    return {
      id: row.id,

      customerId: row.customer_id,

      customerName: customer?.full_name ?? "Unknown",

      activityType: row.activity_type,

      description: row.description,

      oldValue: row.old_value,

      newValue: row.new_value,

      changedByName: nameOf(row.changed_by),

      changedAt: row.changed_at,
    };
  });
}
