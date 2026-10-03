import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CarFront } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import type { RelationshipType, RelationshipStatus } from "@/src/lib/types/customer";

interface VehicleDealCardProps {
  carId: string;
  vehicleTitle: string;
  vehicleImageUrl: string | null;
  relationshipType: RelationshipType;
  relationshipStatus: RelationshipStatus;
  assignedStaffName: string | null;
  updatedAt: string;
  actions?: React.ReactNode;
}

const STATUS_VARIANT: Record<RelationshipStatus, "success" | "warning" | "danger"> = {
  Active: "success",
  Completed: "success",
  Cancelled: "danger",
};

export function VehicleDealCard({
  carId,
  vehicleTitle,
  vehicleImageUrl,
  relationshipType,
  relationshipStatus,
  assignedStaffName,
  updatedAt,
  actions,
}: VehicleDealCardProps) {
  return (
    <Card padding="md" className="flex items-center gap-3">
      <div className="bg-card-hover flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {vehicleImageUrl ? (
          <img src={vehicleImageUrl} alt="" className="size-full object-cover" />
        ) : (
          <CarFront className="text-text-subtle size-5" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/inventory/${carId}`}
          className="text-body-sm text-text-primary hover:text-primary-text truncate font-medium"
        >
          {vehicleTitle}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge status="info">{relationshipType}</Badge>
          <Badge status={STATUS_VARIANT[relationshipStatus]}>{relationshipStatus}</Badge>
        </div>
        <p className="text-caption mt-1">
          {assignedStaffName ? `Assigned: ${assignedStaffName}` : "Unassigned"} · updated{" "}
          {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </p>
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </Card>
  );
}
