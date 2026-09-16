export const ROLES = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  SALES_EXECUTIVE: "Sales Executive",
  FINANCE: "Finance",
  INVENTORY_MANAGER: "Inventory Manager",
  CONTENT_MANAGER: "Content Manager",
  VIEWER: "Viewer",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const ADMIN_ROLES: RoleName[] = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role as RoleName);
}
