"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import {
  isEligibleTestDriveHost,
  requireTestDrivePermission,
} from "@/src/lib/supabase/test-drive-permissions";
import {
  getCustomerById,
  getOpenLeadsForCustomer,
  getVehicleById,
  searchCustomers,
  searchVehicles,
} from "@/src/lib/supabase/test-drive-form-queries";
import {
  checkTestDriveSlot,
  computeAvailabilityForRange,
  computeTestDriveSlots,
  findNearestSlots,
  getShowroomScheduleInfo,
  getStaffAvailabilityForSlot,
} from "@/src/lib/supabase/test-drive-availability";
import { createTestDriveSchema } from "@/src/lib/validation/test-drive";
import { addDaysToIso, dubaiLocalToDate } from "@/src/lib/utils/test-drive-slots";
import { isSlotConflictError, mapTestDriveDbError } from "@/src/lib/utils/test-drive-errors";
import type {
  CreateTestDriveResult,
  MonthAvailability,
  NearestSlot,
  SearchResult,
  ShowroomScheduleInfo,
  StaffAvailabilityMap,
  TestDriveCustomerOption,
  TestDriveLeadOption,
  TestDriveSlotsResult,
  TestDriveVehicleOption,
} from "@/src/lib/types/test-drive";

// --- Search and lookups for the form (read-only) ---

export async function searchTestDriveCustomersAction(
  query: string,
): Promise<SearchResult<TestDriveCustomerOption>> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return { results: [], failed: true };
  return searchCustomers(query);
}

export async function searchTestDriveVehiclesAction(
  query: string,
): Promise<SearchResult<TestDriveVehicleOption>> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return { results: [], failed: true };
  return searchVehicles(query);
}

export async function getCustomerOpenLeadsAction(
  customerId: string,
): Promise<SearchResult<TestDriveLeadOption>> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return { results: [], failed: true };
  return getOpenLeadsForCustomer(customerId);
}

export async function getShowroomScheduleInfoAction(
  locationId: string,
): Promise<ShowroomScheduleInfo | null> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return null;
  if (!z.string().uuid().safeParse(locationId).success) return null;
  return getShowroomScheduleInfo(locationId);
}

// --- Availability (read-only) ---

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const duration = z.number().int().min(15).max(480);

const slotsInputSchema = z.object({
  carId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: isoDate,
  durationMinutes: duration,
  staffId: z.string().uuid().nullable(),
});

export async function getTestDriveSlotsAction(input: unknown): Promise<TestDriveSlotsResult | null> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return null;

  const parsed = slotsInputSchema.safeParse(input);
  if (!parsed.success) return null;

  return computeTestDriveSlots(parsed.data);
}

const monthInputSchema = z
  .object({
    carId: z.string().uuid(),
    locationId: z.string().uuid(),
    durationMinutes: duration,
    staffId: z.string().uuid().nullable(),
    startDate: isoDate,
    endDate: isoDate,
  })
  // A month grid is at most 42 days. Anything much wider isn't a calendar request.
  .refine(
    (v) => v.endDate >= v.startDate && v.endDate <= addDaysToIso(v.startDate, 60),
    "Invalid date range",
  );

export async function getMonthAvailabilityAction(input: unknown): Promise<MonthAvailability | null> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return null;

  const parsed = monthInputSchema.safeParse(input);
  if (!parsed.success) return null;

  return computeAvailabilityForRange(parsed.data);
}

const nearestInputSchema = z.object({
  carId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: isoDate,
  time: timeOfDay.nullable(),
  durationMinutes: duration,
  staffId: z.string().uuid().nullable(),
});

export async function getNearestSlotsAction(input: unknown): Promise<NearestSlot[] | null> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return null;

  const parsed = nearestInputSchema.safeParse(input);
  if (!parsed.success) return null;

  return findNearestSlots(parsed.data);
}

const staffAvailabilityInputSchema = z.object({
  locationId: z.string().uuid(),
  date: isoDate,
  time: timeOfDay,
  durationMinutes: duration,
});

export async function getStaffAvailabilityAction(input: unknown): Promise<StaffAvailabilityMap | null> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) return null;

  const parsed = staffAvailabilityInputSchema.safeParse(input);
  if (!parsed.success) return null;

  return getStaffAvailabilityForSlot(parsed.data);
}

// --- Create ---

export async function createTestDrive(input: unknown): Promise<CreateTestDriveResult> {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) {
    return { error: permission.error ?? "You don't have permission to create test drives." };
  }

  const parsed = createTestDriveSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }
  const v = parsed.data;

  const supabase = await createClient();

  // 1. The records the form points at must still exist and be usable.
  const [customer, vehicle] = await Promise.all([getCustomerById(v.customerId), getVehicleById(v.carId)]);

  if (!customer) return { error: "That customer could not be found. Please search again." };
  if (!vehicle) return { error: "That vehicle could not be found, or it has been archived." };
  if (vehicle.is_sold) return { error: "This vehicle has been sold and can't be booked for a test drive." };

  if (v.staffId && !(await isEligibleTestDriveHost(supabase, v.staffId))) {
    return { error: "That person can't host test drives." };
  }

  if (v.leadId) {
    const { data: lead } = await supabase
      .from("leads")
      .select("customer_id, archived_at, stage:lead_stages(stage_type)")
      .eq("id", v.leadId)
      .maybeSingle();

    const leadRow = lead as unknown as {
      customer_id: string;
      archived_at: string | null;
      stage: { stage_type: string } | null;
    } | null;

    if (!leadRow || leadRow.archived_at) return { error: "That lead could not be found." };
    if (leadRow.customer_id !== v.customerId)
      return { error: "The selected lead belongs to a different customer." };
    if (leadRow.stage?.stage_type !== "open")
      return { error: "That lead is already closed. Choose an open lead." };
  }

  // 2. The chosen time must be genuinely free. The browser's list can be stale.
  const check = await checkTestDriveSlot({
    carId: v.carId,
    locationId: v.locationId,
    date: v.date,
    time: v.time,
    durationMinutes: v.durationMinutes,
    staffId: v.staffId,
  });

  if (check.status === "error") return { error: "We couldn't check availability. Please try again." };
  if (check.status === "blocked") return { error: check.message, refreshAvailability: true };

  // 3. The request source: what was chosen, or "Admin Dashboard".
  let requestSourceId = v.requestSourceId;
  if (!requestSourceId) {
    const { data: source } = await supabase
      .from("test_drive_request_sources")
      .select("id")
      .eq("slug", "admin-dashboard")
      .maybeSingle();
    requestSourceId = source?.id ?? null;
  }

  // 4. Save the request. Always Pending: a manager approves it later, which re-checks availability.
  const { data: created, error: insertError } = await supabase
    .from("test_drives")
    .insert({
      customer_id: v.customerId,
      car_id: v.carId,
      location_id: v.locationId,
      lead_id: v.leadId,
      assigned_staff_id: v.staffId,
      scheduled_start: dubaiLocalToDate(v.date, v.time).toISOString(),
      duration_minutes: v.durationMinutes,
      buffer_minutes: check.bufferMinutes,
      status: "Pending",
      request_source_id: requestSourceId,
      customer_notes: v.customerNotes.trim() || null,
      internal_notes: v.internalNotes.trim() || null,
    })
    .select("id, test_drive_number")
    .single();

  if (insertError || !created) {
    console.error("createTestDrive insert error:", insertError);
    return {
      error: insertError
        ? mapTestDriveDbError(insertError)
        : "Your changes could not be saved. Please try again.",
      refreshAvailability: insertError ? isSlotConflictError(insertError) : false,
    };
  }

  let warning: string | undefined;

  // 5. Optionally create a lead. The test drive is already safely saved, so a
  //    problem here becomes a warning instead of losing the request.
  if (v.createLead) {
    const { data: stage } = await supabase.from("lead_stages").select("id").eq("slug", "new").maybeSingle();
    const { data: fallbackStage } = stage
      ? { data: null }
      : await supabase
          .from("lead_stages")
          .select("id")
          .eq("stage_type", "open")
          .order("sort_order")
          .limit(1)
          .maybeSingle();
    const stageId = stage?.id ?? fallbackStage?.id;

    if (!stageId) {
      warning =
        "The test drive was created, but no starting pipeline stage is configured, so no lead was created.";
    } else {
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          customer_id: v.customerId,
          car_id: v.carId,
          stage_id: stageId,
          temperature: "Warm",
        })
        .select("id")
        .single();

      if (leadError || !lead) {
        console.error("createTestDrive lead error:", leadError);
        warning =
          "The test drive was created, but the lead could not be created. You can add one from the Leads page.";
      } else {
        const { error: linkError } = await supabase
          .from("test_drives")
          .update({ lead_id: lead.id })
          .eq("id", created.id);
        if (linkError) {
          console.error("createTestDrive link error:", linkError);
          warning = "The test drive and a new lead were created, but they couldn't be linked automatically.";
        }
        revalidatePath("/admin/leads");
      }
    }
  }

  revalidatePath("/admin/test-drives");

  return { error: null, testDriveId: created.id, testDriveNumber: created.test_drive_number, warning };
}
