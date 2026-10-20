// What a person may do with test drives. The permissions themselves live in the
// database (role_permission_grants), so access follows the roles configured in the
// app. Nothing here is a hard-coded role name.

export const TEST_DRIVE_PERMISSION_KEYS = {
  create: "test_drives.create",
  edit: "test_drives.edit",
  reschedule: "test_drives.reschedule",
  approve: "test_drives.approve",
  assign: "test_drives.assign",
  cancel: "test_drives.cancel",
  checkIn: "test_drives.check_in",
  complete: "test_drives.complete",
  host: "test_drives.host",
  settings: "test_drives.settings",
} as const;

/** The permissions that describe what the person looking at the screen can do. */
export type TestDrivePermissionName =
  "create" | "edit" | "reschedule" | "approve" | "assign" | "cancel" | "checkIn" | "complete";

export type TestDrivePermissions = Record<TestDrivePermissionName, boolean>;

export const NO_TEST_DRIVE_PERMISSIONS: TestDrivePermissions = {
  create: false,
  edit: false,
  reschedule: false,
  approve: false,
  assign: false,
  cancel: false,
  checkIn: false,
  complete: false,
};

export const TEST_DRIVE_PERMISSION_MESSAGES: Record<TestDrivePermissionName, string> = {
  create: "You don't have permission to create test drives.",
  edit: "You don't have permission to edit test drives.",
  reschedule: "You don't have permission to reschedule test drives.",
  approve: "You don't have permission to approve or reject test drives.",
  assign: "You don't have permission to assign staff.",
  cancel: "You don't have permission to cancel test drives.",
  checkIn: "You don't have permission to check customers in.",
  complete: "You don't have permission to complete test drives or mark no shows.",
};

export function toTestDrivePermissions(keys: readonly string[]): TestDrivePermissions {
  const granted = new Set(keys);

  return {
    create: granted.has(TEST_DRIVE_PERMISSION_KEYS.create),
    edit: granted.has(TEST_DRIVE_PERMISSION_KEYS.edit),
    reschedule: granted.has(TEST_DRIVE_PERMISSION_KEYS.reschedule),
    approve: granted.has(TEST_DRIVE_PERMISSION_KEYS.approve),
    assign: granted.has(TEST_DRIVE_PERMISSION_KEYS.assign),
    cancel: granted.has(TEST_DRIVE_PERMISSION_KEYS.cancel),
    checkIn: granted.has(TEST_DRIVE_PERMISSION_KEYS.checkIn),
    complete: granted.has(TEST_DRIVE_PERMISSION_KEYS.complete),
  };
}

export function hasAnyTestDrivePermission(permissions: TestDrivePermissions): boolean {
  return Object.values(permissions).some(Boolean);
}
