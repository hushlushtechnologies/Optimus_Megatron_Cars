export type TestDriveStatus =
  "Pending" | "Approved" | "Rejected" | "Rescheduled" | "Cancelled" | "Completed" | "No Show";

export type TestDriveInterest = "Very Interested" | "Interested" | "Considering" | "Not Interested";

/** Statuses that hold a vehicle and staff slot. */
export const ACTIVE_TEST_DRIVE_STATUSES: TestDriveStatus[] = ["Approved", "Rescheduled"];

/** Statuses nothing can follow. */
export const FINAL_TEST_DRIVE_STATUSES: TestDriveStatus[] = ["Rejected", "Cancelled", "Completed", "No Show"];

// Mirrors the transition rules the database enforces in protect_test_drive().
// The UI uses this to show only valid actions. The database remains the real gatekeeper.
export const TEST_DRIVE_TRANSITIONS: Record<TestDriveStatus, TestDriveStatus[]> = {
  Pending: ["Approved", "Rejected", "Cancelled"],
  Approved: ["Rescheduled", "Cancelled", "Completed", "No Show"],
  Rescheduled: ["Cancelled", "Completed", "No Show"],
  Rejected: [],
  Cancelled: [],
  Completed: [],
  "No Show": [],
};

export function canTransitionTestDrive(from: TestDriveStatus, to: TestDriveStatus): boolean {
  return TEST_DRIVE_TRANSITIONS[from].includes(to);
}

/** Error codes raised by the database triggers, for friendly messages later. */
export const TEST_DRIVE_DB_ERRORS = {
  EXCLUSION_VIOLATION: "23P01",
  CHECK_VIOLATION: "23514",
  VEHICLE_OVERLAP_CONSTRAINT: "test_drives_no_vehicle_overlap",
  STAFF_OVERLAP_CONSTRAINT: "test_drives_no_staff_overlap",
  OUTSIDE_HOURS: "TD001",
  BLACKOUT: "TD002",
  STAFF_UNAVAILABLE: "TD003",
  INVALID_TRANSITION: "TD004",
  RESCHEDULE_RULE: "TD005",
  LEAD_CUSTOMER_MISMATCH: "TD006",
  IMMUTABLE_FIELD: "TD007",
  CHECK_IN_RULE: "TD008",
  FEEDBACK_NEEDS_COMPLETED: "TD009",
  VEHICLE_ARCHIVED: "TD010",
  NOT_ALLOWED: "TD011",
  HOST_NOT_ELIGIBLE: "TD012",
  CHECK_IN_NOT_OPEN: "TD013",
  CHECK_IN_ENDED: "TD014",
  CHANGED_MEANWHILE: "TD015",
  NOT_FOUND: "TD016",
} as const;

export interface TestDrive {
  id: string;
  test_drive_number: string;
  customer_id: string;
  car_id: string;
  lead_id: string | null;
  location_id: string;
  assigned_staff_id: string | null;
  scheduled_start: string;
  duration_minutes: number;
  buffer_minutes: number;
  scheduled_end: string;
  blocked_end: string;
  status: TestDriveStatus;
  request_source_id: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface TestDriveRequestSource {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface ShowroomHours {
  location_id: string;
  day_of_week: number; // 0 = Sunday ... 6 = Saturday
  is_closed: boolean;
  opens_at: string; // "HH:MM:SS", Asia/Dubai local time
  closes_at: string;
}

export interface TestDriveLocationSettings {
  location_id: string;
  is_enabled: boolean;
  slot_interval_minutes: number;
  default_duration_minutes: number;
  buffer_minutes: number;
  min_notice_hours: number;
  max_advance_days: number;
  reminder_minutes_before: number;
}

export interface TestDriveBlackout {
  id: string;
  location_id: string | null; // null = every showroom
  starts_on: string; // YYYY-MM-DD
  ends_on: string;
  reason: string;
}

export interface TestDriveStaffUnavailability {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface TestDriveStatusHistoryEntry {
  id: string;
  test_drive_id: string;
  old_status: TestDriveStatus | null;
  new_status: TestDriveStatus;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface TestDriveScheduleHistoryEntry {
  id: string;
  test_drive_id: string;
  old_start: string;
  new_start: string;
  old_duration_minutes: number;
  new_duration_minutes: number;
  old_location_id: string | null;
  new_location_id: string | null;
  reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface TestDriveStaffAssignmentEntry {
  id: string;
  test_drive_id: string;
  previous_staff_id: string | null;
  new_staff_id: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface TestDriveActivityEntry {
  id: string;
  test_drive_id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface TestDriveFeedback {
  id: string;
  test_drive_id: string;
  interest_level: TestDriveInterest | null;
  staff_feedback: string | null;
  customer_feedback: string | null;
  next_step: string | null;
  follow_up_required: boolean;
  recorded_by: string | null;
  recorded_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

// --- Display types (Phase 2) ---
// What the screens need to render a test drive: names already resolved,
// not raw foreign keys. The queries that produce this shape arrive in Phase 3.

export interface TestDriveSummary {
  id: string;
  test_drive_number: string;
  status: TestDriveStatus;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  customer: { id: string; full_name: string; customer_number: string; phone: string };
  vehicle: { id: string; display_title: string; brand_name: string | null; stock_id: string };
  location_name: string;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  lead_id: string | null;
  lead_number: string | null;
  request_source_name: string | null;
  checked_in_at: string | null;
  created_at: string;
}

export interface TestDriveTimeSlot {
  /** Local Asia/Dubai wall-clock time, "HH:mm" */
  time: string;
  available: boolean;
  /** Why it's unavailable, e.g. "Vehicle already booked" */
  reason?: string;
}

export interface TestDriveTimelineEntry {
  id: string;
  activity_type: string;
  description: string;
  changedByName: string;
  changed_at: string;
}

// --- Table / list types (Phase 4) ---

export type TestDriveSort = "upcoming" | "newest" | "oldest" | "recently-updated" | "date-asc" | "date-desc";

/** One row of public.test_drive_list, flattened. Names are already resolved. */
export interface TestDriveListRow {
  id: string;
  test_drive_number: string;
  status: TestDriveStatus;
  scheduled_start: string;
  scheduled_end: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  checked_in_at: string | null;
  customer_id: string;
  customer_name: string;
  customer_number: string;
  customer_photo_url: string | null;
  car_id: string;
  vehicle_title: string;
  stock_id: string;
  brand_name: string | null;
  model_name: string | null;
  location_id: string;
  location_name: string;
  assigned_staff_id: string | null;
  staff_name: string | null;
  lead_id: string | null;
  lead_number: string | null;
  request_source_name: string | null;
}

// --- Calendar types (Phase 5) ---

export interface TestDriveCalendarFilterOptions {
  showrooms: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
}

// --- Create form types (Phase 6) ---

export interface SearchResult<T> {
  results: T[];
  /** The search itself failed (as opposed to finding nothing). */
  failed: boolean;
}

export interface TestDriveCustomerOption {
  id: string;
  full_name: string;
  customer_number: string;
  phone: string;
  photo_url: string | null;
}

export interface TestDriveVehicleOption {
  id: string;
  display_title: string;
  stock_id: string;
  brand_name: string | null;
  location_id: string | null;
  location_name: string | null;
  status_name: string | null;
  /** Sold vehicles can't be booked for a test drive. */
  is_sold: boolean;
}

export interface TestDriveLeadOption {
  id: string;
  lead_number: string;
  customer_id: string;
  car_id: string | null;
  vehicle_title: string | null;
  stage_name: string;
  stage_type: string;
  created_at: string;
}

export interface TestDriveFormLookups {
  showrooms: { id: string; name: string }[];
  staff: { id: string; full_name: string }[];
  requestSources: { id: string; name: string; slug: string }[];
}

export interface TestDriveFormPrefill {
  customer: TestDriveCustomerOption | null;
  vehicle: TestDriveVehicleOption | null;
  lead: TestDriveLeadOption | null;
}

export interface ShowroomScheduleInfo {
  location_id: string;
  /** False when the showroom has no test drive settings, or has them switched off. */
  enabled: boolean;
  hours: { day_of_week: number; is_closed: boolean; opens_at: string; closes_at: string }[];
  blackouts: { starts_on: string; ends_on: string; reason: string }[];
  settings: {
    slot_interval_minutes: number;
    default_duration_minutes: number;
    buffer_minutes: number;
    min_notice_hours: number;
    max_advance_days: number;
  };
}

export interface TestDriveSlotsResult {
  slots: TestDriveTimeSlot[];
  /** Set when the whole day can't be booked, e.g. "The showroom is closed on this day." */
  closedReason: string | null;
  bufferMinutes: number;
}

export interface CreateTestDriveResult {
  error: string | null;
  /** The chosen time is no longer free: clear it and re-check availability. */
  refreshAvailability?: boolean;
  testDriveId?: string;
  testDriveNumber?: string;
  /** The test drive saved, but a follow-up step (such as creating a lead) did not. */
  warning?: string;
}

// --- Scheduling engine types (Phase 7) ---

export interface DayAvailability {
  /** Start times that are free on this date. */
  free: number;
  /** Every start time the showroom offers on this date. */
  total: number;
  /** Set when the whole day can't be booked (closed, past, too far ahead). */
  closedReason: string | null;
}

/** Keyed by YYYY-MM-DD. */
export type MonthAvailability = Record<string, DayAvailability>;

export type DayHintState = "open" | "limited" | "full" | "closed";

export interface DayHint {
  state: DayHintState;
  label: string;
}

export interface NearestSlot {
  date: string;
  time: string;
}

export interface StaffSlotAvailability {
  state: "available" | "busy" | "away";
  /** e.g. "Hosting OMC-TD-000042, 11:00 – 12:00" or "On leave: Annual leave" */
  detail: string | null;
}

/** Keyed by staff id. */
export type StaffAvailabilityMap = Record<string, StaffSlotAvailability>;

export type TestDriveSlotCheck =
  { status: "ok"; bufferMinutes: number } | { status: "blocked"; message: string } | { status: "error" };

// --- Approval workflow types (Phase 8) ---

export type BookingProblemKind =
  "unavailable" | "passed" | "closed" | "hours" | "notice" | "vehicle" | "staff_busy" | "staff_away";

export interface BookingProblem {
  kind: BookingProblemKind;
  message: string;
  /** Extra context, e.g. "OMC-TD-000042, 11:00 – 12:00". */
  detail: string | null;
}

export interface TestDriveActionResult {
  error: string | null;
}

/** What the Approve dialog shows before anything is changed. */
export interface ApprovalPreview {
  /** The test drive's status right now. If it isn't Pending, someone else got there first. */
  status: TestDriveStatus;
  staff: { id: string; full_name: string }[];
  staffAvailability: StaffAvailabilityMap | null;
  problems: BookingProblem[];
}

/** The few fields the action dialogs need. A TestDriveListRow already has all of them. */
export type TestDriveActionSubject = Pick<
  TestDriveListRow,
  | "id"
  | "test_drive_number"
  | "status"
  | "customer_name"
  | "vehicle_title"
  | "scheduled_start"
  | "scheduled_end"
  | "location_name"
  | "assigned_staff_id"
  | "staff_name"
  | "checked_in_at"
>;

// --- Staff assignment types (Phase 9) ---

/** What the Assign / Reassign dialog shows before anything is changed. */
export interface AssignmentPreview {
  /** The test drive's status right now. If it has become final, someone else got there first. */
  status: TestDriveStatus;
  /** Who hosts it right now (null if nobody). */
  currentStaffId: string | null;
  staff: { id: string; full_name: string }[];
  /** Who is free, busy or on leave at this drive's exact time. */
  staffAvailability: StaffAvailabilityMap | null;
  /** Problems with the chosen staff member only. Empty when none is chosen. */
  problems: BookingProblem[];
}

export interface TestDriveAssignmentHistoryItem {
  id: string;
  previous_staff_name: string | null;
  new_staff_name: string | null;
  changed_by_name: string;
  changed_at: string;
}

// --- Staff assignment types (Phase 9) ---

/** What the Assign / Reassign dialog shows before anything is changed. */
export interface AssignmentPreview {
  /** The test drive's status right now. If it has become final, someone else got there first. */
  status: TestDriveStatus;
  /** Who hosts it right now (null if nobody). */
  currentStaffId: string | null;
  staff: { id: string; full_name: string }[];
  /** Who is free, busy or on leave at this drive's exact time. */
  staffAvailability: StaffAvailabilityMap | null;
  /** Problems with the chosen staff member only. Empty when none is chosen. */
  problems: BookingProblem[];
}

export interface TestDriveAssignmentHistoryItem {
  id: string;
  previous_staff_name: string | null;
  new_staff_name: string | null;
  changed_by_name: string;
  changed_at: string;
}

// --- Detail page types (Phase 10) ---

/** The list row plus everything only the detail page needs. */
export interface TestDriveDetail extends TestDriveListRow {
  customer_phone: string;
  buffer_minutes: number;
  customer_notes: string | null;
  internal_notes: string | null;
  rejection_reason: string | null;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
  actual_start_at: string | null;
  actual_end_at: string | null;
  archived_at: string | null;
  created_by_name: string | null;
  checked_in_by_name: string | null;
}

/** One change to the date, time, duration or showroom, with names already resolved. */
export interface TestDriveScheduleChangeItem {
  id: string;
  old_start: string;
  new_start: string;
  old_duration_minutes: number;
  new_duration_minutes: number;
  old_location_name: string | null;
  new_location_name: string | null;
  reason: string | null;
  changed_by_name: string;
  changed_at: string;
}

export interface TestDriveStatusChangeItem {
  id: string;
  old_status: TestDriveStatus | null;
  new_status: TestDriveStatus;
  reason: string | null;
  changed_by_name: string;
  changed_at: string;
}

export interface TestDriveDetailData {
  detail: TestDriveDetail;
  /** null means the lookup failed, which is different from "nothing has happened yet". */
  timeline: TestDriveTimelineEntry[] | null;
  scheduleChanges: TestDriveScheduleChangeItem[] | null;
  statusChanges: TestDriveStatusChangeItem[] | null;
  /** Who gave the current host this drive, and when. name is null when it was done by the system. */
  assignedBy: { name: string | null; at: string } | null;
}

export type TestDriveDetailResult =
  { status: "ok"; data: TestDriveDetailData } | { status: "not_found" } | { status: "error" };

// --- Edit and reschedule types (Phase 11, part 2) ---

/** Everything the Edit and Reschedule dialogs need, loaded fresh when they open. */
export interface TestDriveEditData {
  id: string;
  testDriveNumber: string;
  status: TestDriveStatus;
  isCheckedIn: boolean;
  locationId: string;
  scheduledStart: string;
  durationMinutes: number;
  staffId: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  requestSourceId: string | null;
  /** The record's version. Saving only works if nobody changed it in the meantime. */
  updatedAt: string;
  showrooms: { id: string; name: string }[];
  hosts: { id: string; full_name: string }[];
  requestSources: { id: string; name: string }[];
  /** What this person may do, decided by the server. */
  can: { edit: boolean; reschedule: boolean; assign: boolean };
}

export interface TestDriveSaveResult {
  error: string | null;
  /** Nothing was different, so nothing was saved. */
  unchanged?: boolean;
  /** The chosen time was taken in the meantime: the form should clear it and look again. */
  refreshAvailability?: boolean;
}

// --- Check-in types (Phase 13) ---

export type CheckInWindowState =
  { state: "too_early"; opensAtIso: string } | { state: "open"; late: boolean } | { state: "ended" };

/** Everything the check-in dialog shows, loaded fresh when it opens. */
export interface TestDriveCheckInData {
  id: string;
  testDriveNumber: string;
  status: TestDriveStatus;
  archived: boolean;
  checkedInAt: string | null;
  checkedInByName: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  locationName: string;
  vehicleTitle: string;
  hostName: string | null;
  customer: { name: string; number: string; phone: string };
  window: CheckInWindowState;
  opensBeforeMinutes: number;
  /** The record's version. Checking in only works if nobody changed it in the meantime. */
  updatedAt: string;
}

/** A test drive row as the check-in desk shows it. */
export type TestDriveArrival = TestDriveListRow & { customer_phone: string };

// --- Completion and feedback types (Phase 14) ---

/** What the Complete dialog needs, loaded fresh when it opens. */
export interface TestDriveCompletionData {
  id: string;
  testDriveNumber: string;
  status: TestDriveStatus;
  scheduledStart: string;
  durationMinutes: number;
  checkedInAt: string | null;
  /** The record's version. Completing only works if nobody changed it in the meantime. */
  updatedAt: string;
}

/** Feedback as the detail page shows it, with names already resolved. */
export interface TestDriveFeedbackItem {
  interest_level: TestDriveInterest | null;
  staff_feedback: string | null;
  customer_feedback: string | null;
  next_step: string | null;
  follow_up_required: boolean;
  recorded_by_name: string | null;
  recorded_at: string;
  updated_by_name: string | null;
  updated_at: string | null;
}

export type TestDriveFeedbackLoad =
  { status: "ok"; feedback: TestDriveFeedbackItem | null } | { status: "error" };

// --- Customer and lead integration types (Phase 15) ---

/** One test drive as a customer's or a lead's page lists it. */
export interface TestDrivePanelItem {
  id: string;
  test_drive_number: string;
  status: TestDriveStatus;
  scheduled_start: string;
  scheduled_end: string;
  car_id: string;
  vehicle_title: string;
  brand_name: string | null;
  location_name: string;
  staff_name: string | null;
  lead_id: string | null;
  lead_number: string | null;
  checked_in_at: string | null;
  interest_level: TestDriveInterest | null;
  follow_up_required: boolean;
  has_feedback: boolean;
  /** Why it was rejected or cancelled, when it was. */
  reason: string | null;
  /** The live follow-up created from this drive, if any (a cancelled one doesn't count). */
  follow_up: { status: string; type: string; scheduled_at: string; lead_id: string } | null;
}

export type TestDrivePanelLoad = { status: "ok"; items: TestDrivePanelItem[] } | { status: "error" };

export interface TestDriveFollowUpItem {
  id: string;
  status: string;
  type: string;
  scheduled_at: string;
  lead_id: string;
}

export type TestDriveFollowUpLoad = { status: "ok"; items: TestDriveFollowUpItem[] } | { status: "error" };

/** What the Create follow-up dialog needs, loaded fresh when it opens. */
export interface TestDriveFollowUpFormData {
  testDriveNumber: string;
  status: TestDriveStatus;
  archived: boolean;
  customerName: string;
  vehicleTitle: string;
  lead: { id: string; leadNumber: string; stageName: string; isOpen: boolean } | null;
  /** The customer's open leads. Only filled when the drive has no lead yet. */
  openLeads: TestDriveLeadOption[];
  openLeadsFailed: boolean;
  /** An open lead for the same vehicle already exists, so creating another would duplicate it. */
  sameVehicleLead: { id: string; leadNumber: string } | null;
  /** The live follow-up already created from this drive, if any. */
  existing: { status: string; type: string; scheduledAt: string } | null;
  canManageLeads: boolean;
  canLinkLead: boolean;
  interest: TestDriveInterest | null;
  nextStep: string | null;
}
