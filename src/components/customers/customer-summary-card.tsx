import { Card } from "@/src/components/ui/card";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import {
  CustomerLifecycleBadge,
  CustomerAccountStatusBadge,
} from "@/src/components/customers/customer-status-badge";
import type { CustomerProfile } from "@/src/lib/types/customer";

interface CustomerSummaryCardProps {
  customer: CustomerProfile;
  onClick?: () => void;
}

export function CustomerSummaryCard({ customer, onClick }: CustomerSummaryCardProps) {
  return (
    <Card
      variant="elevated"
      padding="md"
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
    >
      <div className="flex items-center gap-3">
        <CustomerAvatar fullName={customer.full_name} photoUrl={customer.profile_photo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-body-lg text-text-primary truncate font-medium">{customer.full_name}</p>
          <p className="text-caption">{customer.customer_number}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <CustomerLifecycleBadge status={customer.lifecycle_status} />
            <CustomerAccountStatusBadge status={customer.account_status} />
          </div>
        </div>
      </div>
    </Card>
  );
}
