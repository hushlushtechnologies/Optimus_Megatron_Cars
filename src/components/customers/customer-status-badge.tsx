import { StatusBadge } from "@/src/components/ui/status-badge";
import type { CustomerProfile } from "@/src/lib/types/customer";

const LIFECYCLE_COLORS: Record<CustomerProfile["lifecycle_status"], string> = {
  Prospect: "#94a3b8",
  Active: "#34d399",
  VIP: "#d4af37",
  Inactive: "#71839c",
  "Do Not Contact": "#f87171",
};

const ACCOUNT_COLORS: Record<CustomerProfile["account_status"], string> = {
  "No Account": "#71839c",
  "Pending Setup": "#f59e0b",
  Active: "#34d399",
  Disabled: "#f87171",
};

export function CustomerLifecycleBadge({ status }: { status: CustomerProfile["lifecycle_status"] }) {
  return <StatusBadge label={status} colorHex={LIFECYCLE_COLORS[status]} />;
}

export function CustomerAccountStatusBadge({ status }: { status: CustomerProfile["account_status"] }) {
  return <StatusBadge label={status} colorHex={ACCOUNT_COLORS[status]} />;
}
