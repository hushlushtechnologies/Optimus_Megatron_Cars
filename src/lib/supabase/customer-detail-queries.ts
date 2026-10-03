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

type CustomerTagRelation =
  | CustomerTag
  | CustomerTag[]
  | null;

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

function normalizeRelation<T>(
  value: T | T[] | null
): T | null {
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

export async function getCustomerDetail(
  customerId: string
): Promise<CustomerDetail | null> {
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
  const {
    data,
    error,
  } = await supabase
    .from("customer_profiles")
    .select(
      `
        *,
        location:locations(name),
        source:customer_sources(name)
      `
    )
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    console.error(
      `[getCustomerDetail]
code: ${error.code}
message: ${error.message}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`
    );

    return null;
  }

  if (!data) {
    return null;
  }

  const customer =
    data as unknown as RawCustomerDetail;

  let primaryRelationshipManager:
    | {
        id: string;
        full_name: string | null;
      }
    | null = null;

  /*
   * Fetch relationship manager directly
   * instead of relying on PostgREST FK embedding.
   */
  if (
    customer.primary_relationship_manager_id
  ) {
    const {
      data: manager,
      error: managerError,
    } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq(
        "id",
        customer.primary_relationship_manager_id
      )
      .maybeSingle();

    if (managerError) {
      console.error(
        `[getCustomerDetail:manager]
code: ${managerError.code}
message: ${managerError.message}
details: ${managerError.details ?? "none"}
hint: ${managerError.hint ?? "none"}`
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

    location: normalizeRelation(
      customer.location
    ),

    source: normalizeRelation(
      customer.source
    ),

    primary_relationship_manager:
      primaryRelationshipManager,
  };
}

/* =========================================================
   AUTH STATUS
========================================================= */

export async function getCustomerAuthStatus(
  userId: string | null
): Promise<CustomerAuthStatus | null> {
  if (!userId) {
    return null;
  }

  const adminClient = createAdminClient();

  const {
    data,
    error,
  } =
    await adminClient.auth.admin.getUserById(
      userId
    );

  if (error || !data.user) {
    return null;
  }

  const bannedUntil =
    data.user.banned_until ?? null;

  return {
    lastSignInAt:
      data.user.last_sign_in_at ?? null,

    emailConfirmedAt:
      data.user.email_confirmed_at ?? null,

    isBanned:
      bannedUntil !== null &&
      new Date(bannedUntil) > new Date(),
  };
}

/* =========================================================
   CUSTOMER TAGS
========================================================= */

export async function getCustomerTags(
  customerId: string
): Promise<CustomerTag[]> {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("customer_tag_links")
    .select(
      `
        tag:customer_tags(
          id,
          name,
          color_hex
        )
      `
    )
    .eq("customer_id", customerId);

  if (error) {
    console.error(
      `[getCustomerTags]
code: ${error.code}
message: ${error.message}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`
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

    return Array.isArray(tag)
      ? tag
      : [tag];
  });
}