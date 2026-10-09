"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";

import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

import { createCustomer } from "@/app/admin/customers/new/actions";

import { addCustomerDefaults } from "@/src/lib/validation/customer";

import { addLeadSchema, type AddLeadValues } from "@/src/lib/validation/lead";

/* =========================================================
   TYPES
========================================================= */

interface BrandRelation {
  name: string;
}

type BrandRelationValue = BrandRelation | BrandRelation[] | null;

interface RawLeadCarSearchRow {
  id: string;
  display_title: string;
  stock_id: string;
  brand: BrandRelationValue;
}

export interface LeadCarSearchResult {
  id: string;
  display_title: string;
  stock_id: string;
  brand_name: string | null;
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
   SEARCH CUSTOMERS
========================================================= */

export async function searchCustomersForLead() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_profiles")
    .select(
      `
        id,
        full_name,
        customer_number,
        phone
      `,
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (error) {
    console.error("searchCustomersForLead error:", error);

    return [];
  }

  return data ?? [];
}

/* =========================================================
   SEARCH CARS
========================================================= */

export async function searchCarsForLead(): Promise<LeadCarSearchResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cars")
    .select(
      `
        id,
        display_title,
        stock_id,
        brand:brands(
          name
        )
      `,
    )
    .is("archived_at", null)
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  if (error) {
    console.error("searchCarsForLead error:", error);

    return [];
  }

  const cars = (data ?? []) as unknown as RawLeadCarSearchRow[];

  return cars.map((car): LeadCarSearchResult => {
    const brand = normalizeRelation(car.brand);

    return {
      id: car.id,

      display_title: car.display_title,

      stock_id: car.stock_id,

      brand_name: brand?.name ?? null,
    };
  });
}

/* =========================================================
   CREATE LEAD
========================================================= */

export async function createLead(values: AddLeadValues) {
  /* ---------------------------------------------------------
     PERMISSION
  --------------------------------------------------------- */

  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,

      leadId: null,
    };
  }

  /* ---------------------------------------------------------
     VALIDATION
  --------------------------------------------------------- */

  const parsed = addLeadSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",

      leadId: null,
    };
  }

  const supabase = await createClient();

  /* =========================================================
     VALIDATE STARTING STAGE
  ========================================================= */

  /*
   * A new lead cannot start directly in Won or Lost.
   *
   * Starting in a closed stage would bypass the normal
   * win/loss workflow, including lost reason validation
   * and closure bookkeeping.
   */

  const { data: startStage, error: startStageError } = await supabase
    .from("lead_stages")
    .select("stage_type")
    .eq("id", parsed.data.stage_id)
    .maybeSingle();

  if (startStageError) {
    console.error("createLead start stage error:", startStageError);

    return {
      error: "Unable to validate the selected lead stage.",

      leadId: null,
    };
  }

  if (!startStage) {
    return {
      error: "The selected lead stage could not be found.",

      leadId: null,
    };
  }

  if (startStage.stage_type !== "open") {
    return {
      error: "New leads must start in an open pipeline stage.",

      leadId: null,
    };
  }

  /* =========================================================
     CUSTOMER
  ========================================================= */

  let customerId = parsed.data.customer_id ?? null;

  /* =========================================================
     CREATE NEW CUSTOMER IF REQUESTED
  ========================================================= */

  if (parsed.data.create_new_customer) {
    const firstName = parsed.data.new_first_name?.trim();

    const lastName = parsed.data.new_last_name?.trim();

    const email = parsed.data.new_email?.trim();

    const phone = parsed.data.new_phone?.trim();

    if (!firstName || !lastName || !email || !phone) {
      return {
        error: "Complete the new customer details before creating the lead.",

        leadId: null,
      };
    }

    const result = await createCustomer(
      {
        ...addCustomerDefaults,

        first_name: firstName,

        last_name: lastName,

        email,

        phone,

        source_id: parsed.data.source_id || addCustomerDefaults.source_id,
      },
      [],
    );

    if (result.error || !result.customerId) {
      return {
        error: result.error ?? "Unable to create the customer for this lead.",

        leadId: null,
      };
    }

    customerId = result.customerId;
  }

  /* =========================================================
     CUSTOMER REQUIRED
  ========================================================= */

  if (!customerId) {
    return {
      error: "Select or create a customer.",

      leadId: null,
    };
  }

  /* =========================================================
     CREATE LEAD
  ========================================================= */

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      customer_id: customerId,

      car_id: parsed.data.car_id || null,

      stage_id: parsed.data.stage_id,

      temperature: parsed.data.temperature,

      source_id: parsed.data.source_id || null,

      source_detail: parsed.data.source_detail?.trim() || null,

      assigned_staff_id: parsed.data.assigned_staff_id || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("createLead error:", error);

    return {
      error: "Unable to create this lead. Please try again.",

      leadId: null,
    };
  }

  /*
   * Phase 1 trigger:
   *
   * leads_log_created automatically writes the
   * initial "Lead created" activity.
   */

  /* =========================================================
     TAGS
  ========================================================= */

  if (parsed.data.tag_ids.length > 0) {
    const { error: tagError } = await supabase.from("lead_tag_links").insert(
      parsed.data.tag_ids.map((tagId) => ({
        lead_id: lead.id,

        tag_id: tagId,
      })),
    );

    if (tagError) {
      console.error("createLead tag error:", tagError);
    }
  }

  /* =========================================================
     FOLLOW-UP
  ========================================================= */

  if (parsed.data.follow_up_date) {
    const time = parsed.data.follow_up_time || "09:00";

    const scheduledAt = new Date(`${parsed.data.follow_up_date}T${time}`);

    const { error: followUpError } = await supabase.from("lead_follow_ups").insert({
      lead_id: lead.id,

      type: "General Follow-Up",

      scheduled_at: scheduledAt.toISOString(),
    });

    if (followUpError) {
      console.error("createLead follow-up error:", followUpError);
    }

    /*
     * Phase 1 trigger:
     *
     * sync_lead_next_follow_up automatically updates
     * leads.next_follow_up_at.
     */
  }

  /* =========================================================
     NOTE
  ========================================================= */

  const note = parsed.data.notes?.trim();

  if (note) {
    const { error: noteError } = await supabase.from("lead_notes").insert({
      lead_id: lead.id,

      note_text: note,
    });

    if (noteError) {
      console.error("createLead note error:", noteError);
    }
  }

  /* =========================================================
     REVALIDATE
  ========================================================= */

  revalidatePath("/admin/leads");

  return {
    error: null,

    leadId: lead.id,
  };
}
