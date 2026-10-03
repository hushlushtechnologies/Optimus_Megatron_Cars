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

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "Admin";

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-6 lg:gap-6 lg:pb-8">
      {/* =====================================================
          GREETING / DASHBOARD INTRO
      ===================================================== */}

      <section aria-label="Dashboard greeting" className="min-w-0">
        <GreetingBanner name={firstName} />
      </section>

      {/* =====================================================
          KPI OVERVIEW
      ===================================================== */}

      <section
        aria-label="Key performance indicators"
        className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <div key={kpi.id} className="min-w-0">
            <KpiCard
              id={kpi.id}
              label={kpi.label}
              value={kpi.value}
              prefix={kpi.prefix}
              change={kpi.change}
              trend={kpi.trend}
            />
          </div>
        ))}
      </section>

      {/* =====================================================
          ANALYTICS ROW
          Revenue + Inventory
      ===================================================== */}

      <section
        aria-label="Revenue and inventory analytics"
        className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        {/* Revenue needs more horizontal space */}

        <div className="min-w-0 xl:col-span-7">
          <RevenueChart />
        </div>

        {/* Inventory */}

        <div className="min-w-0 xl:col-span-5">
          <InventoryStatus />
        </div>
      </section>

      {/* =====================================================
          SALES PERFORMANCE
          
          IMPORTANT:
          Do not force 3 columns at md.
          These are information-heavy cards.
      ===================================================== */}

      <section
        aria-label="Sales performance"
        className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-12"
      >
        {/* Fastest selling */}

        <div className="min-w-0 2xl:col-span-4">
          <FastestSelling />
        </div>

        {/* Top executive */}

        <div className="min-w-0 2xl:col-span-4">
          <TopSalesExecutive />
        </div>

        {/* Conversion */}

        <div className="min-w-0 lg:col-span-2 2xl:col-span-4">
          <ConversionFunnel />
        </div>
      </section>

      {/* =====================================================
          OPERATIONS / CRM
          
          All 3 need enough width.
          The old 5 / 4 / 3 layout made LeadSummary too narrow.
      ===================================================== */}

      <section
        aria-label="Operational activity"
        className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-12"
      >
        {/* Recent activity */}

        <div className="min-w-0 2xl:col-span-4">
          <RecentActivity />
        </div>

        {/* Test drives */}

        <div className="min-w-0 2xl:col-span-4">
          <UpcomingTestDrives />
        </div>

        {/* Lead summary */}

        <div className="min-w-0 xl:col-span-2 2xl:col-span-4">
          <LeadSummary />
        </div>
      </section>
    </div>
  );
}
