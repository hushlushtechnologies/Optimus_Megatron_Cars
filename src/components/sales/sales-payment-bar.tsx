"use client";

import { motion } from "motion/react";
import { useMotion } from "@/src/hooks/use-motion";
import { formatMoney, paidPercent } from "@/src/lib/utils/sales-format";
import type { SalesListRow } from "@/src/lib/types/sales-list";

export function SalesPaymentBar({ row }: { row: SalesListRow }) {
  const { transition, reduce } = useMotion();
  const percent = paidPercent(row.total_due, row.verified_paid);

  if (percent === null) {
    return <span className="text-caption text-text-subtle">No price agreed yet</span>;
  }

  const settled = (row.balance_due ?? 1) <= 0;

  return (
    <div className="flex min-w-[130px] flex-col gap-1">
      <div
        role="progressbar"
        aria-label="Verified payments"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-border/70 h-1.5 overflow-hidden rounded-full"
      >
        <motion.div
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={transition(0.5)}
          className={settled ? "bg-success h-full rounded-full" : "bg-primary h-full rounded-full"}
        />
      </div>
      <p className="text-caption text-text-subtle tabular-nums">
        {settled ? "Paid in full" : `${formatMoney(row.balance_due, row.currency)} due`}
      </p>
    </div>
  );
}
