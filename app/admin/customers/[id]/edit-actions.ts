"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";

import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

import { addCustomerSchema, normalizeUaePhone, type AddCustomerValues } from "@/src/lib/validation/customer";

import { addCustomerTag, removeCustomerTag } from "@/app/admin/customers/[id]/tags-actions";

/* =========================================================
   TYPES
========================================================= */

interface SourceRelation {
  name: string;
}

interface AuditedProfileSnapshot {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  alternative_phone: string | null;

  location_id: string | null;

  address: string | null;

  preferred_language: string | null;
}

interface BeforeCustomerRow extends AuditedProfileSnapshot {
  lifecycle_status: string;

  source_id: string | null;

  source: SourceRelation | SourceRelation[] | null;
}

type AuditedProfileField = keyof AuditedProfileSnapshot;

/* =========================================================
   CONSTANTS
========================================================= */

const AUDITED_FIELD_LABELS: Record<AuditedProfileField, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  email: "Email",
  phone: "Phone",

  alternative_phone: "Alternative Phone",

  location_id: "Location",

  address: "Address",

  preferred_language: "Preferred Language",
};

const AUDITED_PROFILE_FIELDS = Object.keys(AUDITED_FIELD_LABELS) as AuditedProfileField[];

/* =========================================================
   HELPERS
========================================================= */

function mapSaveError(error: { code?: string; message: string }): string {
  if (error.code === "23505" && error.message.includes("email")) {
    return "Another customer already uses this email address.";
  }

  console.error("Customer update error:", error);

  return "Unable to update this customer. Please try again.";
}

function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/* =========================================================
   UPDATE CUSTOMER
========================================================= */

export async function updateCustomer(customerId: string, values: AddCustomerValues, tagIds: string[]) {
  /* ---------------------------------------------------------
     PERMISSION
  --------------------------------------------------------- */

  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return {
      error: permission.error,
    };
  }

  /* ---------------------------------------------------------
     VALIDATION
  --------------------------------------------------------- */

  const parsed = addCustomerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
    };
  }

  const supabase = await createClient();

  /* =========================================================
     GET CURRENT CUSTOMER BEFORE UPDATE
  ========================================================= */

  const { data: beforeData, error: beforeError } = await supabase
    .from("customer_profiles")
    .select(
      `
        lifecycle_status,
        source_id,
        source:customer_sources(name),

        first_name,
        last_name,
        email,
        phone,
        alternative_phone,
        location_id,
        address,
        preferred_language
      `,
    )
    .eq("id", customerId)
    .maybeSingle();

  if (beforeError) {
    console.error(
      `[updateCustomer:before]
code: ${beforeError.code ?? "unknown"}
message: ${beforeError.message ?? "unknown"}
details: ${beforeError.details ?? "none"}
hint: ${beforeError.hint ?? "none"}`,
    );

    return {
      error: "Unable to load the existing customer details.",
    };
  }

  if (!beforeData) {
    return {
      error: "Customer not found.",
    };
  }

  const before = beforeData as unknown as BeforeCustomerRow;

  /* =========================================================
     DUPLICATE EMAIL CHECK
  ========================================================= */

  const { data: existingEmail, error: existingEmailError } = await supabase
    .from("customer_profiles")
    .select("id")
    .eq("email", parsed.data.email)
    .neq("id", customerId)
    .maybeSingle();

  if (existingEmailError) {
    console.error(
      `[updateCustomer:emailCheck]
code: ${existingEmailError.code ?? "unknown"}
message: ${existingEmailError.message ?? "unknown"}
details: ${existingEmailError.details ?? "none"}
hint: ${existingEmailError.hint ?? "none"}`,
    );

    return {
      error: "Unable to validate the customer email.",
    };
  }

  if (existingEmail) {
    return {
      error: "Another customer already uses this email address.",
    };
  }

  /* =========================================================
     NORMALIZE NEXT VALUES
  ========================================================= */

  const phone = normalizeUaePhone(parsed.data.phone);

  const nextProfileSnapshot: AuditedProfileSnapshot = {
    first_name: parsed.data.first_name,

    last_name: parsed.data.last_name,

    email: parsed.data.email,

    phone,

    alternative_phone: normalizeNullableString(parsed.data.alternative_phone),

    location_id: normalizeNullableString(parsed.data.location_id),

    address: normalizeNullableString(parsed.data.address),

    preferred_language: normalizeNullableString(parsed.data.preferred_language),
  };

  /* =========================================================
     UPDATE CUSTOMER
  ========================================================= */

  const { error: updateError } = await supabase
    .from("customer_profiles")
    .update({
      first_name: parsed.data.first_name,

      last_name: parsed.data.last_name,

      email: parsed.data.email,

      phone,

      alternative_phone: nextProfileSnapshot.alternative_phone,

      location_id: nextProfileSnapshot.location_id,

      address: nextProfileSnapshot.address,

      preferred_language: parsed.data.preferred_language,

      source_id: parsed.data.source_id,

      source_detail: normalizeNullableString(parsed.data.source_detail),

      lifecycle_status: parsed.data.lifecycle_status,

      primary_relationship_manager_id: normalizeNullableString(parsed.data.primary_relationship_manager_id),
    })
    .eq("id", customerId);

  if (updateError) {
    return {
      error: mapSaveError(updateError),
    };
  }

  /* =========================================================
     LIFECYCLE STATUS AUDIT
  ========================================================= */

  if (before.lifecycle_status !== parsed.data.lifecycle_status) {
    const { error: activityError } = await supabase.from("customer_activity").insert({
      customer_id: customerId,

      activity_type: "status_changed",

      old_value: before.lifecycle_status,

      new_value: parsed.data.lifecycle_status,

      description: `Customer status changed from ${before.lifecycle_status} to ${parsed.data.lifecycle_status}`,
    });

    if (activityError) {
      console.error(
        `[updateCustomer:statusActivity]
code: ${activityError.code ?? "unknown"}
message: ${activityError.message ?? "unknown"}`,
      );
    }
  }

  /* =========================================================
     SOURCE AUDIT
  ========================================================= */

  if (before.source_id !== parsed.data.source_id) {
    const { data: newSource, error: newSourceError } = await supabase
      .from("customer_sources")
      .select("name")
      .eq("id", parsed.data.source_id)
      .maybeSingle();

    if (newSourceError) {
      console.error(
        `[updateCustomer:newSource]
code: ${newSourceError.code ?? "unknown"}
message: ${newSourceError.message ?? "unknown"}`,
      );
    }

    const oldSource = normalizeRelation(before.source);

    const oldSourceName = oldSource?.name ?? "None";

    const newSourceName = newSource?.name ?? "Unknown";

    const { error: sourceActivityError } = await supabase.from("customer_activity").insert({
      customer_id: customerId,

      activity_type: "source_changed",

      old_value: oldSourceName,

      new_value: newSourceName,

      description: `Source changed from ${oldSourceName} to ${newSourceName}`,
    });

    if (sourceActivityError) {
      console.error(
        `[updateCustomer:sourceActivity]
code: ${sourceActivityError.code ?? "unknown"}
message: ${sourceActivityError.message ?? "unknown"}`,
      );
    }
  }

  /* =========================================================
     GENERAL PROFILE FIELD AUDIT
  ========================================================= */

  const changedFields = AUDITED_PROFILE_FIELDS.filter((field) => {
    const oldValue = before[field] ?? null;

    const newValue = nextProfileSnapshot[field] ?? null;

    return oldValue !== newValue;
  });

  if (changedFields.length > 0) {
    const changedLabels = changedFields.map((field) => AUDITED_FIELD_LABELS[field]);

    const description = changedLabels.join(", ");

    const { error: profileActivityError } = await supabase.from("customer_activity").insert({
      customer_id: customerId,

      activity_type: "profile_updated",

      old_value: description,

      new_value: null,

      description: `Profile updated: ${description}`,
    });

    if (profileActivityError) {
      console.error(
        `[updateCustomer:profileActivity]
code: ${profileActivityError.code ?? "unknown"}
message: ${profileActivityError.message ?? "unknown"}`,
      );
    }
  }

  /* =========================================================
     TAG DIFF
  ========================================================= */

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from("customer_tag_links")
    .select("tag_id")
    .eq("customer_id", customerId);

  if (currentLinksError) {
    console.error(
      `[updateCustomer:tags]
code: ${currentLinksError.code ?? "unknown"}
message: ${currentLinksError.message ?? "unknown"}
details: ${currentLinksError.details ?? "none"}
hint: ${currentLinksError.hint ?? "none"}`,
    );

    return {
      error: "Customer was updated, but tags could not be synchronized.",
    };
  }

  const currentTagIds = (currentLinks ?? []).map((link) => link.tag_id);

  const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));

  const toRemove = currentTagIds.filter((id) => !tagIds.includes(id));

  await Promise.all([
    ...toAdd.map((tagId) => addCustomerTag(customerId, tagId)),

    ...toRemove.map((tagId) => removeCustomerTag(customerId, tagId)),
  ]);

  /* =========================================================
     REVALIDATE
  ========================================================= */

  revalidatePath(`/admin/customers/${customerId}`);

  revalidatePath("/admin/customers");

  return {
    error: null,
  };
}
