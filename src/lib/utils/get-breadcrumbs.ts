import { NAV_SECTIONS } from "@/src/config/nav";

export interface Breadcrumb {
  label: string;
  href: string;
}

// Dynamic route segments with no matching sidebar entry get a friendlier label here.
const SEGMENT_LABEL_OVERRIDES: Record<string, string> = {
  new: "Add Car",
  edit: "Edit",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function findNavLabel(href: string): string | null {
  for (const section of NAV_SECTIONS) {
    const match = section.items.find((item) => item.href === href);
    if (match) return match.label;
  }
  return null;
}

function toTitleCase(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [];

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = UUID_PATTERN.test(segment)
      ? "Vehicle"
      : (findNavLabel(path) ?? SEGMENT_LABEL_OVERRIDES[segment] ?? toTitleCase(segment));
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export function getPageTitle(pathname: string): string {
  const crumbs = getBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "Dashboard";
}
