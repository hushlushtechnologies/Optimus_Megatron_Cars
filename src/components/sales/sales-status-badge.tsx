import {
  BadgeCheck,
  Clock,
  CheckCircle2,
  Handshake,
  PencilLine,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { SalesDealStatus } from "@/src/lib/types/sales";

export const SALES_STATUS_META: Record<
  SalesDealStatus,
  { icon: LucideIcon; raw: string; description: string }
> = {
  Draft: { icon: PencilLine, raw: "#94a3b8", description: "Being prepared" },
  Negotiation: { icon: Handshake, raw: "#60a5fa", description: "Price and terms being agreed" },
  Reserved: { icon: Clock, raw: "#f59e0b", description: "Vehicle held for this customer" },
  Confirmed: { icon: CheckCircle2, raw: "#34d399", description: "Agreed, waiting for delivery" },
  Completed: { icon: BadgeCheck, raw: "#d4af37", description: "Vehicle delivered" },
  Cancelled: { icon: XCircle, raw: "#f87171", description: "Deal cancelled" },
};

interface SalesStatusBadgeProps {
  status: SalesDealStatus;
  size?: "sm" | "md";
  className?: string;
}

export function SalesStatusBadge({ status, size = "md", className }: SalesStatusBadgeProps) {
  const { icon: Icon, raw } = SALES_STATUS_META[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border text-[var(--omc-status-text)]",
        size === "sm" ? "text-caption px-2 py-0.5" : "text-body-sm px-2.5 py-1",
        className,
      )}
      style={
        {
          "--omc-status-raw": raw,
          backgroundColor: `${raw}1A`,
          borderColor: `${raw}66`,
        } as React.CSSProperties
      }
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
      {status}
    </span>
  );
}
