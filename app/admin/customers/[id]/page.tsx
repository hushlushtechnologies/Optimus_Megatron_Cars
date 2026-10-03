import { notFound } from "next/navigation";

import {
  CalendarClock,
  CarFront,
  MailQuestion,
  Landmark,
  Repeat,
  Sparkles,
  Heart,
  MessageCircle,
} from "lucide-react";

import {
  getCustomerDetail,
  getCustomerAuthStatus,
  getCustomerTags,
} from "@/src/lib/supabase/customer-detail-queries";

import { getCustomerFilterLookups } from "@/src/lib/supabase/customer-lookups";

import { Tabs, TabsList, Tab, TabPanel } from "@/src/components/ui/tabs";

import { CustomerDetailHeader } from "@/src/components/customers/customer-detail-header";

import { CustomerContactCard } from "@/src/components/customers/customer-contact-card";

import { AccountManagementCard } from "@/src/components/customers/account-management-card";

import { RelationshipManagerCard } from "@/src/components/customers/relationship-manager-card";

import { OverviewTab } from "@/src/components/customers/profile-tabs/overview-tab";

import { NotesTab } from "@/src/components/customers/profile-tabs/notes-tab";

import { ActivityTab } from "@/src/components/customers/profile-tabs/activity-tab";

import { AuditTrailTab } from "@/src/components/customers/profile-tabs/audit-trail-tab";

import { FutureModuleTab } from "@/src/components/customers/profile-tabs/future-module-tab";

import { VehiclesTab } from "@/src/components/customers/profile-tabs/vehicles-tab";

/* =========================================================
   TYPES
========================================================= */

interface CustomerDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/* =========================================================
   PAGE
========================================================= */

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  /* =========================================================
     CUSTOMER
  ========================================================= */

  const customer = await getCustomerDetail(id);

  if (!customer) {
    notFound();
  }

  /* =========================================================
     RELATED DATA
  ========================================================= */

  const [authStatus, assignedTags, lookups] = await Promise.all([
    getCustomerAuthStatus(customer.user_id),

    getCustomerTags(id),

    getCustomerFilterLookups(),
  ]);

  const staffOptions = lookups.staff.map((staff) => ({
    id: staff.id,
    name: staff.full_name,
  }));

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <CustomerDetailHeader customer={customer} assignedTags={assignedTags} availableTags={lookups.tags} />

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* ===================================================
            LEFT COLUMN
        =================================================== */}

        <div className="lg:col-span-2">
          <Tabs defaultTab="overview">
            {/* ===============================================
                TAB NAVIGATION
            =============================================== */}

            <TabsList>
              <Tab id="overview">Overview</Tab>

              <Tab id="vehicles">Vehicles / Deals</Tab>

              <Tab id="reservations">Reservations</Tab>

              <Tab id="test-drives">Test Drives</Tab>

              <Tab id="enquiries">Enquiries</Tab>

              <Tab id="finance">Finance</Tab>

              <Tab id="trade-in">Sell / Trade-In</Tab>

              <Tab id="dream-cars">Dream Cars</Tab>

              <Tab id="wishlist">Wishlist</Tab>

              <Tab id="communications">Communications</Tab>

              <Tab id="notes">Notes</Tab>

              <Tab id="activity">Activity</Tab>

              <Tab id="audit">Audit Trail</Tab>
            </TabsList>

            {/* ===============================================
                OVERVIEW
            =============================================== */}

            <TabPanel id="overview">
              <OverviewTab customer={customer} />
            </TabPanel>

            {/* ===============================================
                VEHICLES
            =============================================== */}

            <TabPanel id="vehicles">
              <VehiclesTab customerId={id} />
            </TabPanel>

            {/* ===============================================
                RESERVATIONS
            =============================================== */}

            <TabPanel id="reservations">
              <FutureModuleTab icon={CalendarClock} title="No reservations yet" />
            </TabPanel>

            {/* ===============================================
                TEST DRIVES
            =============================================== */}

            <TabPanel id="test-drives">
              <FutureModuleTab icon={CarFront} title="This customer has no test drive requests" />
            </TabPanel>

            {/* ===============================================
                ENQUIRIES
            =============================================== */}

            <TabPanel id="enquiries">
              <FutureModuleTab icon={MailQuestion} title="No enquiries yet" />
            </TabPanel>

            {/* ===============================================
                FINANCE
            =============================================== */}

            <TabPanel id="finance">
              <FutureModuleTab icon={Landmark} title="No finance applications available" />
            </TabPanel>

            {/* ===============================================
                TRADE-IN
            =============================================== */}

            <TabPanel id="trade-in">
              <FutureModuleTab icon={Repeat} title="No sell or trade-in requests yet" />
            </TabPanel>

            {/* ===============================================
                DREAM CARS
            =============================================== */}

            <TabPanel id="dream-cars">
              <FutureModuleTab icon={Sparkles} title="No dream car requests yet" />
            </TabPanel>

            {/* ===============================================
                WISHLIST
            =============================================== */}

            <TabPanel id="wishlist">
              <FutureModuleTab icon={Heart} title="This customer's wishlist is empty" />
            </TabPanel>

            {/* ===============================================
                COMMUNICATIONS
            =============================================== */}

            <TabPanel id="communications">
              <FutureModuleTab
                icon={MessageCircle}
                title="No communications logged yet"
                description="Manual communication logging arrives in Sprint 3 Phase 15."
              />
            </TabPanel>

            {/* ===============================================
                NOTES
            =============================================== */}

            <TabPanel id="notes">
              <NotesTab customerId={id} />
            </TabPanel>

            {/* ===============================================
                ACTIVITY
            =============================================== */}

            <TabPanel id="activity">
              <ActivityTab customerId={id} />
            </TabPanel>

            {/* ===============================================
                AUDIT
            =============================================== */}

            <TabPanel id="audit">
              <AuditTrailTab customerId={id} />
            </TabPanel>
          </Tabs>
        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="flex flex-col gap-4">
          {/* ===============================================
              CONTACT
          =============================================== */}

          <CustomerContactCard customer={customer} locationName={customer.location?.name ?? null} />

          {/* ===============================================
              ACCOUNT
          =============================================== */}

          <AccountManagementCard customer={customer} authStatus={authStatus} />

          {/* ===============================================
              PRIMARY RELATIONSHIP MANAGER
          =============================================== */}

          <div className="surface-card p-4">
            <RelationshipManagerCard
              customerId={id}
              currentStaffId={customer.primary_relationship_manager?.id ?? null}
              currentStaffName={customer.primary_relationship_manager?.full_name ?? null}
              staffOptions={staffOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
