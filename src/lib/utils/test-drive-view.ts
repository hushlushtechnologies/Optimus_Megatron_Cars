// A plain module (not "use client") so the server page can read these
// values. Importing a constant from a client module into a server
// component hands you a reference object instead of the real value.
export type TestDriveView = "table" | "calendar";
export const TEST_DRIVE_VIEW_COOKIE = "omc-test-drives-view";
