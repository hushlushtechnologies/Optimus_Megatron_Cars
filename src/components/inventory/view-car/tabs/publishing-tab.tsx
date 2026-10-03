import { Star, Sparkles, Clock, Home } from "lucide-react";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import type { CarDetail } from "@/src/lib/types/car-detail";

function Flag({
  active,
  label,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={
        active
          ? "bg-primary/10 text-body-sm text-primary-text flex items-center gap-1.5 rounded-full px-2.5 py-1"
          : "bg-card-hover text-body-sm text-text-subtle flex items-center gap-1.5 rounded-full px-2.5 py-1"
      }
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

export function PublishingTab({ car }: { car: CarDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Flag active={car.featured} label="Featured" icon={Star} />
        <Flag active={car.new_arrival} label="New Arrival" icon={Sparkles} />
        <Flag active={car.coming_soon} label="Coming Soon" icon={Clock} />
        <Flag active={car.show_on_homepage} label="Show on Homepage" icon={Home} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailSection title="Publishing">
          <DetailRow label="Slug" value={car.slug} />
          <DetailRow label="Publish Date" value={car.publish_date ?? "Immediate"} />
          <DetailRow label="Publishing Status" value={car.publishing_status?.name} />
        </DetailSection>

        <DetailSection title="SEO">
          <DetailRow label="SEO Title" value={car.seo_title} />
          <DetailRow label="SEO Description" value={car.seo_description} />
        </DetailSection>
      </div>
    </div>
  );
}
