import { notFound } from "next/navigation";
import { getCarDetail } from "@/src/lib/supabase/inventory-detail-queries";
import { getAddCarLookups } from "@/src/lib/supabase/inventory-lookups";
import { Tabs, TabsList, Tab, TabPanel } from "@/src/components/ui/tabs";
import { VehicleHero } from "@/src/components/inventory/view-car/vehicle-hero";
import { OverviewTab } from "@/src/components/inventory/view-car/tabs/overview-tab";
import { ExteriorInteriorTab } from "@/src/components/inventory/view-car/tabs/exterior-interior-tab";
import { PricingTab } from "@/src/components/inventory/view-car/tabs/pricing-tab";
import { WarrantyInspectionTab } from "@/src/components/inventory/view-car/tabs/warranty-inspection-tab";
import { MediaTab } from "@/src/components/inventory/view-car/tabs/media-tab";
import { PublishingTab } from "@/src/components/inventory/view-car/tabs/publishing-tab";
import { AuditTab } from "@/src/components/inventory/view-car/tabs/audit-tab";

interface ViewCarPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewCarPage({ params }: ViewCarPageProps) {
  const { id } = await params;

  const [detail, lookups] = await Promise.all([getCarDetail(id), getAddCarLookups()]);

  if (!detail) {
    notFound();
  }

  const { car, createdByName, updatedByName, activity } = detail;
  const featuredImage = car.media?.find((m: { is_featured: boolean }) => m.is_featured) ?? car.media?.[0];
  const subtitle = [car.brand?.name, car.model?.name, car.variant?.name].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <VehicleHero
        carId={car.id}
        displayTitle={car.display_title}
        stockId={car.stock_id}
        subtitle={subtitle}
        regularPrice={car.regular_price}
        featuredImageUrl={featuredImage?.url ?? null}
        availabilityStatus={car.availability_status}
        publishingStatus={car.publishing_status}
        collectionName={car.collection?.name ?? null}
        availabilityStatuses={lookups.availabilityStatuses}
        isArchived={!!car.archived_at}
      />

      <Tabs defaultTab="overview">
        <TabsList>
          <Tab id="overview">Overview</Tab>
          <Tab id="exterior-interior">Exterior &amp; Interior</Tab>
          <Tab id="pricing">Pricing &amp; Promotion</Tab>
          <Tab id="warranty-inspection">Warranty &amp; Inspection</Tab>
          <Tab id="media">Media</Tab>
          <Tab id="publishing">Publishing &amp; SEO</Tab>
          <Tab id="audit">Audit &amp; History</Tab>
        </TabsList>

        <TabPanel id="overview">
          <OverviewTab car={car} />
        </TabPanel>
        <TabPanel id="exterior-interior">
          <ExteriorInteriorTab car={car} />
        </TabPanel>
        <TabPanel id="pricing">
          <PricingTab car={car} />
        </TabPanel>
        <TabPanel id="warranty-inspection">
          <WarrantyInspectionTab car={car} />
        </TabPanel>
        <TabPanel id="media">
          <MediaTab media={car.media ?? []} />
        </TabPanel>
        <TabPanel id="publishing">
          <PublishingTab car={car} />
        </TabPanel>
        <TabPanel id="audit">
          <AuditTab
            car={car}
            createdByName={createdByName}
            updatedByName={updatedByName}
            activity={activity}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
