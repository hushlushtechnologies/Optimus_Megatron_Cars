import { createClient } from "@/src/lib/supabase/server";
import { createAdminClient } from "@/src/lib/supabase/admin";

import type { CustomerProfile } from "@/src/lib/types/customer";
import type { CustomerTag } from "@/src/lib/supabase/customer-lookups";

/* =========================================================
   TYPES
========================================================= */

export interface CustomerDetail extends CustomerProfile {
  location: {
    name: string;
  } | null;

  source: {
    name: string;
  } | null;

  primary_relationship_manager: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface CustomerAuthStatus {
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  isBanned: boolean;
}

export interface CustomerEditValues {
  customer: CustomerProfile;
  tagIds: string[];
}

type CustomerTagRelation = CustomerTag | CustomerTag[] | null;

type RawCustomerDetail = CustomerProfile & {
  primary_relationship_manager_id: string | null;

  location:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;

  source:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/* =========================================================
   CUSTOMER DETAIL
========================================================= */

export async function getCustomerDetail(customerId: string): Promise<CustomerDetail | null> {
  const supabase = await createClient();

  /*
   * Important:
   * Do NOT embed profiles here.
   *
   * PostgREST currently cannot resolve:
   * customer_profiles -> profiles
   *
   * We fetch the PRM separately below.
   */
  const { data, error } = await supabase
    .from("customer_profiles")
    .select(
      `
        *,
        location:locations(name),
        source:customer_sources(name)
      `,
    )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    console.error(
      `[getCustomerDetail]
code: ${error.code}
message: ${error.message}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
    );

    return null;
  }

  if (!data) {
    return null;
  }

  const customer = data as unknown as RawCustomerDetail;

  let primaryRelationshipManager: {
    id: string;
    full_name: string | null;
  } | null = null;

  /*
   * Fetch relationship manager directly
   * instead of relying on PostgREST FK embedding.
   */
  if (customer.primary_relationship_manager_id) {
    const { data: manager, error: managerError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", customer.primary_relationship_manager_id)
      .maybeSingle();

    if (managerError) {
      console.error(
        `[getCustomerDetail:manager]
code: ${managerError.code}
message: ${managerError.message}
details: ${managerError.details ?? "none"}
hint: ${managerError.hint ?? "none"}`,
      );
    }

    if (manager) {
      primaryRelationshipManager = {
        id: manager.id,
        full_name: manager.full_name,
      };
    }
  }

  return {
    ...customer,

    location: normalizeRelation(customer.location),

    source: normalizeRelation(customer.source),

    primary_relationship_manager: primaryRelationshipManager,
  };
}

/* =========================================================
   CUSTOMER EDIT VALUES
========================================================= */

export async function getCustomerEditValues(customerId: string): Promise<CustomerEditValues | null> {
  const supabase = await createClient();

  /*
   * Fetch only the customer profile fields.
   *
   * The edit form does not need location/source/profile
   * relationship objects because it works with their IDs.
   */
  const { data: customer, error: customerError } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    console.error(
      `[getCustomerEditValues:customer]
code: ${customerError.code}
message: ${customerError.message}
details: ${customerError.details ?? "none"}
hint: ${customerError.hint ?? "none"}`,
    );

    return null;
  }

  if (!customer) {
    return null;
  }

  /*
   * Fetch the customer's currently assigned tags.
   */
  const { data: tagLinks, error: tagError } = await supabase
    .from("customer_tag_links")
    .select("tag_id")
    .eq("customer_id", customerId);

  if (tagError) {
    console.error(
      `[getCustomerEditValues:tags]
code: ${tagError.code}
message: ${tagError.message}
details: ${tagError.details ?? "none"}
hint: ${tagError.hint ?? "none"}`,
    );

    return null;
  }

  return {
    customer: customer as unknown as CustomerProfile,

    tagIds: (tagLinks ?? []).map((link) => link.tag_id),
  };
}

/* =========================================================
   AUTH STATUS
========================================================= */

export async function getCustomerAuthStatus(userId: string | null): Promise<CustomerAuthStatus | null> {
  if (!userId) {
    return null;
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return null;
  }

  const bannedUntil = data.user.banned_until ?? null;

  return {
    lastSignInAt: data.user.last_sign_in_at ?? null,

    emailConfirmedAt: data.user.email_confirmed_at ?? null,

    isBanned: bannedUntil !== null && new Date(bannedUntil) > new Date(),
  };
}

/* =========================================================
   CUSTOMER TAGS
========================================================= */

export async function getCustomerTags(customerId: string): Promise<CustomerTag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_tag_links")
    .select(
      `
        tag:customer_tags(
          id,
          name,
          color_hex
        )
      `,
    )
    .eq("customer_id", customerId);

  if (error) {
    console.error(
      `[getCustomerTags]
code: ${error.code}
message: ${error.message}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
    );

    return [];
  }

  const rows = (data ?? []) as unknown as Array<{
    tag: CustomerTagRelation;
  }>;

  return rows.flatMap(({ tag }) => {
    if (!tag) {
      return [];
    }

    return Array.isArray(tag) ? tag : [tag];
  });
}

export async function getCustomerNotesWithAuthors(customerId: string) {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("customer_notes")
    .select("*")
    .eq("customer_id", customerId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const authorIds = new Set<string>();
  (notes ?? []).forEach((n) => n.created_by && authorIds.add(n.created_by));

  const { data: profiles } = authorIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(authorIds))
    : { data: [] };

  const authorNames: Record<string, string> = {};
  (profiles ?? []).forEach((p) => (authorNames[p.id] = p.full_name ?? "Unknown"));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = user
    ? await supabase.from("profiles").select("roles(name)").eq("id", user.id).single()
    : { data: null };
  const currentRoleName = (currentProfile?.roles as unknown as { name: string } | null)?.name;
  const canManageAllNotes =
    !!currentRoleName && ["Super Admin", "Admin", "Manager"].includes(currentRoleName);

  return { notes: notes ?? [], authorNames, currentUserId: user?.id ?? null, canManageAllNotes };
}

export interface EnrichedActivityEntry {
  id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changedByName: string;
  relatedCar: { id: string; display_title: string } | null;
}

export async function getCustomerActivity(customerId: string): Promise<EnrichedActivityEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_activity")
    .select("*")
    .eq("customer_id", customerId)
    .order("changed_at", { ascending: false });

  const entries = data ?? [];
  if (entries.length === 0) return [];

  const userIds = new Set<string>();
  const carIds = new Set<string>();
  entries.forEach((e) => {
    if (e.changed_by) userIds.add(e.changed_by);
    if (e.related_car_id) carIds.add(e.related_car_id);
  });

  const [{ data: profiles }, { data: cars }] = await Promise.all([
    userIds.size
      ? supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds))
      : Promise.resolve({ data: [] }),
    carIds.size
      ? supabase.from("cars").select("id, display_title").in("id", Array.from(carIds))
      : Promise.resolve({ data: [] }),
  ]);

  const nameOf = (id: string | null) =>
    id ? (profiles?.find((p) => p.id === id)?.full_name ?? "Unknown") : "System";
  const carOf = (id: string | null) => (id ? (cars?.find((c) => c.id === id) ?? null) : null);

  return entries.map((e) => ({
    id: e.id,
    activity_type: e.activity_type,
    description: e.description,
    old_value: e.old_value,
    new_value: e.new_value,
    changed_at: e.changed_at,
    changedByName: nameOf(e.changed_by),
    relatedCar: carOf(e.related_car_id) ?? null,
  }));
}
