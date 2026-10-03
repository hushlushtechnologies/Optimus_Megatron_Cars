import { notFound } from "next/navigation";
import { getCustomerDetail, getCustomerAuthStatus, getCustomerTags } from "@/src/lib/supabase/customer-detail-queries";
import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";
import { CustomerDetailHeader } from "@/src/components/customers/customer-detail-header";
import { CustomerContactCard } from "@/src/components/customers/customer-contact-card";
import { AccountManagementCard } from "@/src/components/customers/account-management-card";
import { StaffAssignmentCard } from "@/src/components/customers/staff-assignment-card";
import { updatePrimaryRelationshipManager } from "@/app/admin/customers/[id]/actions";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  const customer = await getCustomerDetail(id);
  if (!customer) notFound();

  const [authStatus, assignedTags, lookups] = await Promise.all([
    getCustomerAuthStatus(customer.user_id),
    getCustomerTags(id),
    getCustomerFilterLookups(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <CustomerDetailHeader
  customer={customer}
  assignedTags={assignedTags}
  availableTags={lookups.tags}
/>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="surface-card p-6 text-center text-body-sm text-text-muted">
            The full tabbed profile (Overview, Vehicles/Deals, Notes, Activity, and more) arrives in Phase 9.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <CustomerContactCard
  customer={customer}
  locationName={
    customer.location?.name ?? null
  }
/>
          <AccountManagementCard customer={customer} authStatus={authStatus} />
          <div className="surface-card p-4">
            <StaffAssignmentCard
              label="Primary Relationship Manager"
              currentStaffId={customer.primary_relationship_manager?.id ?? null}
              currentStaffName={customer.primary_relationship_manager?.full_name ?? null}
              staffOptions={lookups.staff.map((s) => ({ id: s.id, name: s.full_name }))}
              onAssign={(staffId) => updatePrimaryRelationshipManager(id, staffId)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}