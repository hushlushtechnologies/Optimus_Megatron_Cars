import Link from "next/link";
import { CarFront } from "lucide-react";
import type { TestDriveDetail } from "@/src/lib/types/test-drive";

export function DetailVehicleCard({ detail }: { detail: TestDriveDetail }) {
  const makeAndModel = [detail.brand_name, detail.model_name].filter(Boolean).join(" · ");

  return (
    <section aria-label="Vehicle" className="surface-card flex flex-col gap-4 p-5">
      <p className="text-label">Vehicle</p>

      <div className="flex items-start gap-3">
        <span className="bg-card-hover text-text-muted flex size-10 shrink-0 items-center justify-center rounded-md">
          <CarFront className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/admin/inventory/${detail.car_id}`}
            className="text-text-primary hover:text-primary-text block font-medium"
          >
            {detail.vehicle_title}
          </Link>
          {makeAndModel && <p className="text-body-sm text-text-muted">{makeAndModel}</p>}
          <p className="text-caption text-text-subtle">Stock ID {detail.stock_id}</p>
        </div>
      </div>

      <Link
        href={`/admin/inventory/${detail.car_id}`}
        className="text-body-sm text-primary-text hover:text-primary-hover self-start"
      >
        View in inventory
      </Link>
    </section>
  );
}
