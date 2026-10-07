import { createClient } from "@/src/lib/supabase/server";

import type { LeadStage, LeadSummary, LeadTemperature } from "@/src/lib/types/lead";

/* =========================================================
   SHARED RELATION HELPER
========================================================= */

type SupabaseRelation<T> = T | T[] | null;

function normalizeRelation<T>(relation: SupabaseRelation<T>): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

/* =========================================================
   LEAD DETAIL TYPES
========================================================= */

interface LeadCustomerRelation {
  id: string;
  full_name: string;
  customer_number: string;
  phone: string;
}

interface LeadBrandRelation {
  name: string;
}

interface LeadCarRelation {
  id: string;
  display_title: string;
  stock_id: string;

  brand: SupabaseRelation<LeadBrandRelation>;
}

interface LeadSourceRelation {
  name: string;
}

interface RawLeadDetailRow {
  id: string;

  lead_number: string;

  temperature: LeadTemperature;

  source_detail: string | null;

  assigned_staff_id: string | null;

  next_follow_up_at: string | null;

  last_activity_at: string | null;

  created_at: string;

  stage: SupabaseRelation<LeadStage>;

  customer: SupabaseRelation<LeadCustomerRelation>;

  car: SupabaseRelation<LeadCarRelation>;

  source: SupabaseRelation<LeadSourceRelation>;
}

/* =========================================================
   TAG TYPES
========================================================= */

type LeadTag = LeadSummary["tags"][number];

interface LeadTagLinkRow {
  tag: SupabaseRelation<LeadTag>;
}

/* =========================================================
   PROFILE TYPES
========================================================= */

interface ProfileNameRow {
  id: string;

  full_name: string | null;
}

interface StaffNameRow {
  full_name: string | null;
}

/* =========================================================
   ASSIGNMENT HISTORY TYPES
========================================================= */

interface RawLeadAssignmentHistoryRow {
  id: string;

  previous_staff_id: string | null;

  new_staff_id: string | null;

  changed_by: string | null;

  changed_at: string;
}

/* =========================================================
   GET LEAD DETAIL
========================================================= */

export async function getLeadDetail(leadId: string): Promise<LeadSummary | null> {
  const supabase = await createClient();

  /* =========================================================
     LEAD
  ========================================================= */

  const { data, error } = await supabase
    .from("leads")
    .select(
      `
        id,
        lead_number,
        temperature,
        source_detail,
        assigned_staff_id,
        next_follow_up_at,
        last_activity_at,
        created_at,

        stage:lead_stages(
          id,
          name,
          slug,
          stage_type,
          color_hex,
          sort_order,
          is_active
        ),

        customer:customer_profiles(
          id,
          full_name,
          customer_number,
          phone
        ),

        car:cars(
          id,
          display_title,
          stock_id,
          brand:brands(
            name
          )
        ),

        source:customer_sources(
          name
        )
      `,
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("getLeadDetail error:", error);
    }

    return null;
  }

  const raw = data as unknown as RawLeadDetailRow;

  /* =========================================================
     NORMALIZE LEAD RELATIONS
  ========================================================= */

  const stage = normalizeRelation(raw.stage);

  const customer = normalizeRelation(raw.customer);

  const car = normalizeRelation(raw.car);

  const source = normalizeRelation(raw.source);

  if (!stage || !customer) {
    console.error("getLeadDetail missing required relation:", {
      leadId,

      hasStage: Boolean(stage),

      hasCustomer: Boolean(customer),
    });

    return null;
  }

  /* =========================================================
     ASSIGNED STAFF
  ========================================================= */

  let staff: StaffNameRow | null = null;

  if (raw.assigned_staff_id) {
    const { data: staffData, error: staffError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", raw.assigned_staff_id)
      .maybeSingle();

    if (staffError) {
      console.error("getLeadDetail staff error:", staffError);
    }

    staff = staffData;
  }

  /* =========================================================
     TAGS
  ========================================================= */

  const { data: tagLinksData, error: tagLinksError } = await supabase
    .from("lead_tag_links")
    .select(
      `
        tag:lead_tags(
          id,
          name,
          slug,
          color_hex
        )
      `,
    )
    .eq("lead_id", leadId);

  if (tagLinksError) {
    console.error("getLeadDetail tags error:", tagLinksError);
  }

  const tagLinks = (tagLinksData ?? []) as unknown as LeadTagLinkRow[];

  const tags: LeadSummary["tags"] = [];

  for (const row of tagLinks) {
    if (!row.tag) {
      continue;
    }

    const normalizedTags = Array.isArray(row.tag) ? row.tag : [row.tag];

    tags.push(...normalizedTags);
  }

  /* =========================================================
     VEHICLE
  ========================================================= */

  const brand = car ? normalizeRelation(car.brand) : null;

  /* =========================================================
     RETURN
  ========================================================= */

  return {
    id: raw.id,

    lead_number: raw.lead_number,

    stage,

    temperature: raw.temperature,

    source_name: source?.name ?? null,

    source_detail: raw.source_detail,

    customer,

    vehicle: car
      ? {
          id: car.id,

          display_title: car.display_title,

          brand_name: brand?.name ?? null,

          stock_id: car.stock_id,
        }
      : null,

    assigned_staff_id: raw.assigned_staff_id,

    assigned_staff_name: staff?.full_name ?? null,

    tags,

    next_follow_up_at: raw.next_follow_up_at,

    last_activity_at: raw.last_activity_at,

    created_at: raw.created_at,
  };
}

/* =========================================================
   ACTIVE LEAD STAGES
========================================================= */

export async function getActiveLeadStages(): Promise<LeadStage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_stages")
    .select(
      `
        id,
        name,
        slug,
        stage_type,
        color_hex,
        sort_order,
        is_active
      `,
    )
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("getActiveLeadStages error:", error);

    return [];
  }

  return (data ?? []) as LeadStage[];
}

/* =========================================================
   ASSIGNMENT HISTORY
========================================================= */

export interface LeadAssignmentHistoryEntry {
  id: string;

  previousStaffName: string | null;

  newStaffName: string;

  changedByName: string;

  changedAt: string;
}

export async function getLeadAssignmentHistory(leadId: string): Promise<LeadAssignmentHistoryEntry[]> {
  const supabase = await createClient();

  /* =========================================================
     HISTORY
  ========================================================= */

  const { data, error } = await supabase
    .from("lead_staff_assignment_history")
    .select(
      `
        id,
        previous_staff_id,
        new_staff_id,
        changed_by,
        changed_at
      `,
    )
    .eq("lead_id", leadId)
    .order("changed_at", {
      ascending: false,
    });

  if (error) {
    console.error("getLeadAssignmentHistory error:", error);

    return [];
  }

  const rows = (data ?? []) as RawLeadAssignmentHistoryRow[];

  if (rows.length === 0) {
    return [];
  }

  /* =========================================================
     COLLECT USER IDS
  ========================================================= */

  const userIds = new Set<string>();

  for (const row of rows) {
    if (row.previous_staff_id) {
      userIds.add(row.previous_staff_id);
    }

    if (row.new_staff_id) {
      userIds.add(row.new_staff_id);
    }

    if (row.changed_by) {
      userIds.add(row.changed_by);
    }
  }

  /* =========================================================
     RESOLVE PROFILE NAMES
  ========================================================= */

  let profiles: ProfileNameRow[] = [];

  if (userIds.size > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
          id,
          full_name
        `,
      )
      .in("id", Array.from(userIds));

    if (profileError) {
      console.error("getLeadAssignmentHistory profiles error:", profileError);
    }

    profiles = (profileData ?? []) as ProfileNameRow[];
  }

  /* =========================================================
     NAME LOOKUP
  ========================================================= */

  const nameOf = (id: string | null): string | null => {
    if (!id) {
      return null;
    }

    return profiles.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  /* =========================================================
     FINAL HISTORY
  ========================================================= */

  return rows.map((row): LeadAssignmentHistoryEntry => ({
    id: row.id,

    previousStaffName: nameOf(row.previous_staff_id),

    newStaffName: nameOf(row.new_staff_id) ?? "Unknown",

    changedByName: nameOf(row.changed_by) ?? "Unknown",

    changedAt: row.changed_at,
  }));
}
