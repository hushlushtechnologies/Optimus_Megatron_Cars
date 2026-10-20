import { createAdminClient } from "@/src/lib/supabase/admin";
import { createNotification } from "@/src/lib/notifications/create-notification";
import { formatDay, formatTimeRange } from "@/src/lib/utils/test-drive-format";

interface DriveContext {
  number: string;
  customerName: string;
  vehicleTitle: string;
  start: string;
  end: string;
  locationName: string;
}

async function getDriveContext(testDriveId: string): Promise<DriveContext | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("test_drive_list")
    .select("test_drive_number, customer_name, vehicle_title, scheduled_start, scheduled_end, location_name")
    .eq("id", testDriveId)
    .maybeSingle();

  if (!data) return null;

  return {
    number: data.test_drive_number,
    customerName: data.customer_name,
    vehicleTitle: data.vehicle_title,
    start: data.scheduled_start,
    end: data.scheduled_end,
    locationName: data.location_name,
  };
}

async function getName(id: string | null, fallback: string): Promise<string> {
  if (!id) return fallback;
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("full_name").eq("id", id).maybeSingle();
  return data?.full_name ?? fallback;
}

/**
 * Tells the new host, and the previous host if there was one. Nobody is
 * notified about something they just did themselves. Never throws: a failed
 * notification must never undo the assignment that triggered it. These are
 * in-app notifications only. Email and WhatsApp are not connected.
 */
export async function notifyTestDriveStaffChanged(
  testDriveId: string,
  newStaffId: string,
  previousStaffId: string | null,
  actorId: string | null,
): Promise<void> {
  try {
    const [ctx, actorName, newName] = await Promise.all([
      getDriveContext(testDriveId),
      getName(actorId, "Someone"),
      getName(newStaffId, "another team member"),
    ]);
    if (!ctx) return;

    const when = `${formatDay(ctx.start)}, ${formatTimeRange(ctx.start, ctx.end)}`;
    const isReassignment = !!previousStaffId;

    await createNotification({
      recipientId: newStaffId,
      type: isReassignment ? "test_drive_reassigned" : "test_drive_assigned",
      title: isReassignment ? "Test drive reassigned to you" : "New test drive assigned to you",
      description: `${ctx.number} · ${ctx.customerName} · ${ctx.vehicleTitle} · ${when} at ${ctx.locationName}. ${actorName} ${
        isReassignment ? "reassigned it" : "assigned it"
      } to you.`,
      entityType: "test_drive",
      entityId: testDriveId,
      actorId,
    });

    if (previousStaffId && previousStaffId !== newStaffId) {
      await createNotification({
        recipientId: previousStaffId,
        type: "test_drive_reassigned",
        title: "Test drive reassigned away from you",
        description: `${ctx.number} · ${ctx.customerName} · ${when} was reassigned to ${newName} by ${actorName}.`,
        entityType: "test_drive",
        entityId: testDriveId,
        actorId,
      });
    }
  } catch (error) {
    console.error("notifyTestDriveStaffChanged error:", error);
  }
}

interface RescheduleNotice {
  oldStartIso: string;
  oldDurationMinutes: number;
  previousHostId: string | null;
  newHostId: string;
  reason: string;
  actorId: string | null;
}

/**
 * Tells the host that their appointment moved. If the host changed too, the
 * new host hears it as an assignment (which already carries the new time)
 * and the old host as a reassignment. In-app only, and it never throws.
 */
export async function notifyTestDriveRescheduled(
  testDriveId: string,
  notice: RescheduleNotice,
): Promise<void> {
  try {
    if (notice.previousHostId !== notice.newHostId) {
      await notifyTestDriveStaffChanged(testDriveId, notice.newHostId, notice.previousHostId, notice.actorId);
      return;
    }

    const [ctx, actorName] = await Promise.all([
      getDriveContext(testDriveId),
      getName(notice.actorId, "Someone"),
    ]);
    if (!ctx) return;

    const oldEnd = new Date(
      Date.parse(notice.oldStartIso) + notice.oldDurationMinutes * 60_000,
    ).toISOString();

    await createNotification({
      recipientId: notice.newHostId,
      type: "test_drive_rescheduled",
      title: "Test drive rescheduled",
      description: `${ctx.number} · ${ctx.customerName} · ${ctx.vehicleTitle} moved from ${formatDay(notice.oldStartIso)}, ${formatTimeRange(
        notice.oldStartIso,
        oldEnd,
      )} to ${formatDay(ctx.start)}, ${formatTimeRange(ctx.start, ctx.end)} at ${ctx.locationName} by ${actorName}. Reason: ${notice.reason}`,
      entityType: "test_drive",
      entityId: testDriveId,
      actorId: notice.actorId,
    });
  } catch (error) {
    console.error("notifyTestDriveRescheduled error:", error);
  }
}
