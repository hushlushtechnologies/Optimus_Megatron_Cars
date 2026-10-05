import { createClient } from "@/src/lib/supabase/server";

import type { CustomerFilters } from "@/src/lib/utils/customer-filters";
import { parseTagIds } from "@/src/lib/utils/customer-filters";

/* =========================================================
   TYPES
========================================================= */

export interface CustomerExportRow {
  customer_number: string;
  full_name: string;
  email: string;
  phone: string;

  source: string | null;
  location: string | null;

  lifecycle_status: string;
  created_at: string;

  activeDealsCount: number;
  purchasedCount: number;
}

interface GetCustomerExportRowsParams {
  scope: "current" | "selected";

  ids?: string[];
  search?: string;
  archived?: boolean;
  filters?: CustomerFilters;
}

interface RelationName {
  name: string;
}

interface RawCustomerExportRow {
  id: string;

  customer_number: string;
  full_name: string;
  email: string;
  phone: string;

  lifecycle_status: string;
  created_at: string;

  location: RelationName | RelationName[] | null;

  source: RelationName | RelationName[] | null;
}

interface CustomerVehicleRelationRow {
  customer_id: string;

  relationship_type: string | null;

  relationship_status: string | null;
}

/* =========================================================
   CONSTANTS
========================================================= */

const EXPORT_ROW_LIMIT = 2000;

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
   GET CUSTOMER EXPORT ROWS
========================================================= */

export async function getCustomerExportRows({
  scope,
  ids,
  search,
  archived = false,
  filters = {},
}: GetCustomerExportRowsParams): Promise<CustomerExportRow[]> {
  const supabase = await createClient();

  /*
   * This array itself is never reassigned.
   * We only push values into it,
   * so it should be const.
   */
  const idFilterSets: string[][] = [];

  const tagIds = parseTagIds(filters);

  /* =========================================================
     CURRENT VIEW JUNCTION FILTERS
  ========================================================= */

  if (scope === "current") {
    /* -------------------------------------------------------
       TAG FILTER
    ------------------------------------------------------- */

    if (tagIds.length > 0) {
      const { data, error } = await supabase
        .from("customer_tag_links")
        .select("customer_id")
        .in("tag_id", tagIds);

      if (error) {
        console.error(
          `[getCustomerExportRows:tagFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
        );
      }

      idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
    }

    /* -------------------------------------------------------
       ACTIVE DEAL FILTER
    ------------------------------------------------------- */

    if (filters.hasActiveDeals) {
      const { data, error } = await supabase
        .from("customer_vehicle_relations")
        .select("customer_id")
        .eq("relationship_status", "Active");

      if (error) {
        console.error(
          `[getCustomerExportRows:activeDealsFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
        );
      }

      idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
    }

    /* -------------------------------------------------------
       PURCHASED FILTER
    ------------------------------------------------------- */

    if (filters.hasPurchased) {
      const { data, error } = await supabase
        .from("customer_vehicle_relations")
        .select("customer_id")
        .eq("relationship_type", "Purchased");

      if (error) {
        console.error(
          `[getCustomerExportRows:purchasedFilter]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
        );
      }

      idFilterSets.push(Array.from(new Set((data ?? []).map((row) => row.customer_id))));
    }

    /*
     * Any active junction filter
     * returning zero IDs means the
     * complete result is empty.
     */
    if (idFilterSets.some((set) => set.length === 0)) {
      return [];
    }
  }

  /* =========================================================
     INTERSECT JUNCTION FILTER IDS
  ========================================================= */

  const allowedIds =
    idFilterSets.length > 0
      ? idFilterSets.reduce((accumulator, set) => accumulator.filter((id) => set.includes(id)))
      : null;

  /* =========================================================
     MAIN CUSTOMER QUERY
  ========================================================= */

  let query = supabase.from("customer_profiles").select(
    `
        id,
        customer_number,
        full_name,
        email,
        phone,
        lifecycle_status,
        created_at,
        location:locations(name),
        source:customer_sources(name)
      `,
  );

  /* =========================================================
     SELECTED EXPORT
  ========================================================= */

  if (scope === "selected") {
    if (!ids || ids.length === 0) {
      return [];
    }

    query = query.in("id", ids);
  } else {
    /* =======================================================
       CURRENT VIEW ARCHIVE FILTER
    ======================================================= */

    query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

    /* -------------------------------------------------------
       ALLOWED IDS
    ------------------------------------------------------- */

    if (allowedIds) {
      query = query.in("id", allowedIds);
    }

    /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,customer_number.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    /* -------------------------------------------------------
       STATUS
    ------------------------------------------------------- */

    if (filters.status) {
      query = query.eq("lifecycle_status", filters.status);
    }

    /* -------------------------------------------------------
       ACCOUNT STATUS
    ------------------------------------------------------- */

    if (filters.accountStatus) {
      query = query.eq("account_status", filters.accountStatus);
    }

    /* -------------------------------------------------------
       SOURCE
    ------------------------------------------------------- */

    if (filters.source) {
      query = query.eq("source_id", filters.source);
    }

    /* -------------------------------------------------------
       LOCATION
    ------------------------------------------------------- */

    if (filters.location) {
      query = query.eq("location_id", filters.location);
    }

    /* -------------------------------------------------------
       RELATIONSHIP MANAGER
    ------------------------------------------------------- */

    if (filters.prm) {
      query = query.eq("primary_relationship_manager_id", filters.prm);
    }

    /* -------------------------------------------------------
       JOINED FROM
    ------------------------------------------------------- */

    if (filters.joinedFrom) {
      query = query.gte("created_at", filters.joinedFrom);
    }

    /* -------------------------------------------------------
       JOINED TO
    ------------------------------------------------------- */

    if (filters.joinedTo) {
      query = query.lte("created_at", `${filters.joinedTo}T23:59:59`);
    }
  }

  /* =========================================================
     SORT + LIMIT
  ========================================================= */

  query = query
    .order("created_at", {
      ascending: false,
    })
    .limit(EXPORT_ROW_LIMIT);

  /* =========================================================
     EXECUTE
  ========================================================= */

  const { data, error } = await query;

  if (error) {
    console.error(
      `[getCustomerExportRows]
code: ${error.code ?? "unknown"}
message: ${error.message ?? "unknown"}
details: ${error.details ?? "none"}
hint: ${error.hint ?? "none"}`,
    );

    return [];
  }

  /*
   * Type the Supabase rows once here.
   *
   * No `any` is needed later.
   */
  const rawRows = (data ?? []) as unknown as RawCustomerExportRow[];

  /* =========================================================
     CUSTOMER IDS
  ========================================================= */

  const customerIds = rawRows.map((customer) => customer.id);

  /* =========================================================
     DEAL COUNTS
  ========================================================= */

  const dealCounts = new Map<
    string,
    {
      active: number;
      purchased: number;
    }
  >();

  if (customerIds.length > 0) {
    const { data: relationsData, error: relationsError } = await supabase
      .from("customer_vehicle_relations")
      .select(
        `
          customer_id,
          relationship_type,
          relationship_status
        `,
      )
      .in("customer_id", customerIds);

    if (relationsError) {
      console.error(
        `[getCustomerExportRows:relations]
code: ${relationsError.code ?? "unknown"}
message: ${relationsError.message ?? "unknown"}
details: ${relationsError.details ?? "none"}
hint: ${relationsError.hint ?? "none"}`,
      );
    }

    const relations = (relationsData ?? []) as unknown as CustomerVehicleRelationRow[];

    for (const relation of relations) {
      const entry = dealCounts.get(relation.customer_id) ?? {
        active: 0,
        purchased: 0,
      };

      if (relation.relationship_status === "Active") {
        entry.active += 1;
      }

      if (relation.relationship_type === "Purchased") {
        entry.purchased += 1;
      }

      dealCounts.set(relation.customer_id, entry);
    }
  }

  /* =========================================================
     FINAL EXPORT ROWS
  ========================================================= */

  return rawRows.map((customer) => {
    const source = normalizeRelation(customer.source);

    const location = normalizeRelation(customer.location);

    return {
      customer_number: customer.customer_number,

      full_name: customer.full_name,

      email: customer.email,

      phone: customer.phone,

      source: source?.name ?? null,

      location: location?.name ?? null,

      lifecycle_status: customer.lifecycle_status,

      created_at: customer.created_at,

      activeDealsCount: dealCounts.get(customer.id)?.active ?? 0,

      purchasedCount: dealCounts.get(customer.id)?.purchased ?? 0,
    };
  });
}
