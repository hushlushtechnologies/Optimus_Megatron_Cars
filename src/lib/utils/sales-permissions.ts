// What a person may do in sales. The permissions live in the database (role_permission_grants),
// so access follows the roles configured in the app. Nothing here is a hard-coded role name.

export const SALES_PERMISSION_KEYS = {
  view: "sales.view",
  viewAll: "sales.view_all",
  create: "sales.create",
  edit: "sales.edit",
  assign: "sales.assign",
  approveDiscount: "sales.approve_discount",
  confirm: "sales.confirm",
  cancel: "sales.cancel",
  complete: "sales.complete",
  documents: "sales.documents",
  export: "sales.export",
  settings: "sales.settings",
  reservationsView: "reservations.view",
  reservationsRequest: "reservations.request",
  reservationsConfirm: "reservations.confirm",
  reservationsCancel: "reservations.cancel",
  paymentsRecord: "payments.record",
  paymentsVerify: "payments.verify",
  paymentsReverse: "payments.reverse",
} as const;

export type SalesPermissionName = keyof typeof SALES_PERMISSION_KEYS;
export type SalesPermissions = Record<SalesPermissionName, boolean>;

const NAMES = Object.keys(SALES_PERMISSION_KEYS) as SalesPermissionName[];

export const NO_SALES_PERMISSIONS: SalesPermissions = Object.fromEntries(
  NAMES.map((name) => [name, false]),
) as SalesPermissions;

export const SALES_PERMISSION_MESSAGES: Record<SalesPermissionName, string> = {
  view: "You don't have permission to view deals.",
  viewAll: "You don't have permission to view all deals.",
  create: "You don't have permission to create deals.",
  edit: "You don't have permission to edit deals.",
  assign: "You don't have permission to assign deal owners.",
  approveDiscount: "You don't have permission to approve discounts.",
  confirm: "You don't have permission to confirm deals.",
  cancel: "You don't have permission to cancel deals.",
  complete: "You don't have permission to complete deliveries.",
  documents: "You don't have permission to generate documents.",
  export: "You don't have permission to export sales data.",
  settings: "You don't have permission to change sales settings.",
  reservationsView: "You don't have permission to view reservations.",
  reservationsRequest: "You don't have permission to request reservations.",
  reservationsConfirm: "You don't have permission to confirm reservations.",
  reservationsCancel: "You don't have permission to cancel or release reservations.",
  paymentsRecord: "You don't have permission to record payments.",
  paymentsVerify: "You don't have permission to verify payments.",
  paymentsReverse: "You don't have permission to reverse payments.",
};

export function toSalesPermissions(keys: readonly string[]): SalesPermissions {
  const granted = new Set(keys);
  return Object.fromEntries(
    NAMES.map((name) => [name, granted.has(SALES_PERMISSION_KEYS[name])]),
  ) as SalesPermissions;
}

export function hasAnySalesPermission(permissions: SalesPermissions): boolean {
  return Object.values(permissions).some(Boolean);
}
