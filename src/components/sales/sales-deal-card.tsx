"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import { SalesStatusBadge } from "@/src/components/sales/sales-status-badge";
import { SalesPaymentBar } from "@/src/components/sales/sales-payment-bar";
import { SalesExpiryChip } from "@/src/components/sales/sales-expiry-chip";
import { useMotion } from "@/src/hooks/use-motion";
import { formatMoney } from "@/src/lib/utils/sales-format";
import { formatDay } from "@/src/lib/utils/test-drive-format";
import type { SalesListRow } from "@/src/lib/types/sales-list";
import { cn } from "@/src/lib/utils/cn";

interface SalesDealCardProps {
  row: SalesListRow;
  /** Used inside board columns: no status badge, tighter spacing. */
  compact?: boolean;
  index?: number;
}

export function SalesDealCard({ row, compact = false, index = 0 }: SalesDealCardProps) {
  const { fadeUp, reduce } = useMotion();
  const price = row.agreed_price ?? row.proposed_price;

  return (
    <motion.li
      {...fadeUp(index)}
      whileHover={reduce ? undefined : { y: -2 }}
      className={cn(
        "surface-card hover:border-primary/30 relative flex flex-col transition-colors",
        compact ? "gap-2.5 p-3" : "gap-3 p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/admin/sales/${row.id}`}
            className="text-text-primary block truncate font-medium after:absolute after:inset-0 after:content-['']"
          >
            {row.deal_number}
          </Link>
          <p className="text-caption text-text-subtle">{formatDay(row.created_at)}</p>
        </div>
        {!compact && <SalesStatusBadge status={row.status} size="sm" />}
      </div>

      <div className="flex min-w-0 items-center gap-2.5">
        <CustomerAvatar fullName={row.customer_name} photoUrl={row.customer_photo_url} size="sm" />
        <div className="min-w-0">
          <p className="text-text-primary truncate text-sm font-medium">{row.customer_name}</p>
          <p className="text-caption text-text-subtle truncate">{row.customer_number}</p>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-body-sm text-text-primary truncate">{row.vehicle_title}</p>
        <p className="text-caption text-text-subtle truncate">
          {row.stock_id} · {row.location_name}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-caption text-text-subtle">
            {row.agreed_price !== null ? "Agreed price" : "Proposed price"}
          </p>
          <p className="text-text-primary text-base font-semibold tabular-nums">
            {formatMoney(price, row.currency)}
          </p>
        </div>
        <SalesExpiryChip expiresAt={row.reservation_expires_at} reservationStatus={row.reservation_status} />
      </div>

      {!compact && <SalesPaymentBar row={row} />}

      <p className="text-caption text-text-subtle truncate">
        Owner: <span className="text-text-muted">{row.owner_name ?? "Unassigned"}</span>
      </p>
    </motion.li>
  );
}
