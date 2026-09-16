import { getCurrentProfile } from "@/src/lib/supabase/get-profiles";
import { GreetingBanner } from "@/src/components/dashboard/greeting-banner";
import { KpiCard } from "@/src/components/dashboard/kpi-card";
import { RevenueChart } from "@/src/components/dashboard/revenue-chart";
import { InventoryStatus } from "@/src/components/dashboard/inventory-status";
import { FastestSelling } from "@/src/components/dashboard/fastest-selling";
import { TopSalesExecutive } from "@/src/components/dashboard/top-sales-executive";
import { ConversionFunnel } from "@/src/components/dashboard/conversion-funnel";
import { RecentActivity } from "@/src/components/dashboard/recent-activity";
import { UpcomingTestDrives } from "@/src/components/dashboard/upcoming-test-drives";
import { LeadSummary } from "@/src/components/dashboard/lead-summary";
import { kpis } from "@/src/lib/mock-data/dashboard";

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-4">
      <GreetingBanner name={profile?.full_name?.split(" ")[0] || "Admin"} />

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.id}
            id={kpi.id}
            label={kpi.label}
            value={kpi.value}
            prefix={kpi.prefix}
            change={kpi.change}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Bento row 1: revenue (wide) + inventory (narrow) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RevenueChart />
        </div>
        <div className="xl:col-span-5">
          <InventoryStatus />
        </div>
      </div>

      {/* Bento row 2: three even cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FastestSelling />
        <TopSalesExecutive />
        <ConversionFunnel />
      </div>

      {/* Bento row 3: activity + upcoming + leads */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <RecentActivity />
        </div>
        <div className="xl:col-span-4">
          <UpcomingTestDrives />
        </div>
        <div className="xl:col-span-3">
          <LeadSummary />
        </div>
      </div>
    </div>
  );
}
