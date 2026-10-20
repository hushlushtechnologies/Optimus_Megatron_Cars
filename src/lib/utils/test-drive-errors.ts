export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

/**
 * Turns a database error into a message a staff member can act on. Raw
 * database text is never shown. The TD codes are raised by the triggers
 * created in Sprint 5 Phase 1.
 */
export function mapTestDriveDbError(error: DbErrorLike): string {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  switch (error.code) {
    case "23P01":
      if (text.includes("vehicle_overlap")) return "This vehicle is already booked for the selected time.";
      if (text.includes("staff_overlap")) return "The assigned staff member is unavailable.";
      return "That time is no longer available. Please choose another slot.";
    case "TD001":
      return "That time is outside the showroom's opening hours.";
    case "TD002":
      return "The showroom is closed on that date.";
    case "TD003":
      return "The assigned staff member is unavailable.";
    case "TD004":
      return "This test drive can't be changed to that status.";
    case "TD005":
      return "Rescheduling needs a new date, time or showroom.";
    case "TD006":
      return "The selected lead belongs to a different customer.";
    case "TD007":
      return "That detail can't be changed on an existing test drive.";
    case "TD008":
      return "Only a confirmed appointment can be checked in.";
    case "TD009":
      return "Feedback can only be recorded for a completed test drive.";
    case "TD010":
      return "This vehicle is archived and can't be booked.";
    case "TD011":
      return "You don't have permission to do that. Ask an administrator if you need access.";
    case "TD012":
      return "That person can't host test drives.";
    case "TD013":
      return "Check-in hasn't opened yet for this appointment.";
    case "TD014":
      return "This appointment has ended, so the customer can no longer be checked in.";
    case "TD015":
      return "This test drive was just updated by someone else. Refresh the page to see its current status.";
    case "TD016":
      return "That test drive could not be found.";
    case "23514":
      return "Some required details are missing. Please check the form and try again.";
    case "23503":
      return "One of the selected records no longer exists. Refresh the page and try again.";
    default:
      return "Your changes could not be saved. Please try again.";
  }
}

/** True when the cause is the schedule itself, so the form should re-check availability. */
export function isSlotConflictError(error: DbErrorLike): boolean {
  return error.code === "23P01" || ["TD001", "TD002", "TD003"].includes(error.code ?? "");
}
