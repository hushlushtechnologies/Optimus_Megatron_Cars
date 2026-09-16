import { NAV_SECTIONS } from "@/src/config/nav";

export interface Breadcrumb {
  label: string;
  href: string;
}

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
    crumbs.push({
      label: findNavLabel(path) ?? toTitleCase(segment),
      href: path,
    });
  }

  return crumbs;
}

export function getPageTitle(pathname: string): string {
  const crumbs = getBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "Dashboard";
}
