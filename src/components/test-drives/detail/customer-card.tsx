import Link from "next/link";
import { Phone } from "lucide-react";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import type { TestDriveDetail } from "@/src/lib/types/test-drive";

export function DetailCustomerCard({ detail }: { detail: TestDriveDetail }) {
  const dialable = detail.customer_phone.replace(/[^\d+]/g, "");

  return (
    <section aria-label="Customer" className="surface-card flex flex-col gap-4 p-5">
      <p className="text-label">Customer</p>

      <div className="flex items-center gap-3">
        <CustomerAvatar fullName={detail.customer_name} photoUrl={detail.customer_photo_url} size="sm" />
        <div className="min-w-0">
          <Link
            href={`/admin/customers/${detail.customer_id}`}
            className="text-text-primary hover:text-primary-text block truncate font-medium"
          >
            {detail.customer_name}
          </Link>
          <p className="text-caption text-text-subtle truncate">{detail.customer_number}</p>
        </div>
      </div>

      {detail.customer_phone ? (
        <a
          href={`tel:${dialable}`}
          className="text-body-sm text-text-primary hover:text-primary-text focus-visible:ring-primary inline-flex items-center gap-2 self-start rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          <Phone className="text-text-muted size-4" aria-hidden="true" />
          {detail.customer_phone}
          <span className="sr-only"> (call)</span>
        </a>
      ) : (
        <p className="text-body-sm text-text-subtle">No phone number on file.</p>
      )}

      <Link
        href={`/admin/customers/${detail.customer_id}`}
        className="text-body-sm text-primary-text hover:text-primary-hover self-start"
      >
        View customer profile
      </Link>
    </section>
  );
}
