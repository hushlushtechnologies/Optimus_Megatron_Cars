import { notFound } from "next/navigation";

import { getCustomerEditValues } from "@/src/lib/supabase/customer-detail-queries";

import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

import { createClient } from "@/src/lib/supabase/server";

import { AddCustomerForm } from "@/src/components/customers/add-customer/add-customer-form";

import type { AddCustomerValues } from "@/src/lib/validation/customer";

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;

  const [result, lookups, supabase] = await Promise.all([
    getCustomerEditValues(id),
    getCustomerFilterLookups(),
    createClient(),
  ]);

  if (!result) {
    notFound();
  }

  /* =========================================================
     CUSTOMER SOURCES
  ========================================================= */

  const { data: sources, error: sourcesError } = await supabase
    .from("customer_sources")
    .select("id, requires_detail");

  if (sourcesError) {
    console.error("[EditCustomerPage] Unable to load customer sources:", sourcesError);
  }

  const sourcesWithDetail: Record<string, boolean> = Object.fromEntries(
    (sources ?? []).map((source) => [source.id, source.requires_detail]),
  );

  /* =========================================================
     INITIAL FORM VALUES
  ========================================================= */

  const initialValues: Partial<AddCustomerValues> = {
    first_name: result.customer.first_name,

    last_name: result.customer.last_name,

    email: result.customer.email,

    phone: result.customer.phone,

    alternative_phone: result.customer.alternative_phone ?? "",

    location_id: result.customer.location_id ?? "",

    address: result.customer.address ?? "",

    preferred_language: result.customer.preferred_language,

    source_id: result.customer.source_id ?? "",

    source_detail: result.customer.source_detail ?? "",

    lifecycle_status: result.customer.lifecycle_status,

    primary_relationship_manager_id: result.customer.primary_relationship_manager_id ?? "",

    internal_notes: "",

    create_login: false,
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-h1">Edit Customer</h1>

        <p className="text-body-sm text-text-muted">
          Updating {result.customer.first_name} {result.customer.last_name}
          &apos;s profile.
        </p>
      </div>

      <AddCustomerForm
        mode="edit"
        customerId={id}
        initialValues={initialValues}
        initialTagIds={result.tagIds}
        lookups={lookups}
        sourcesWithDetail={sourcesWithDetail}
      />
    </div>
  );
}
