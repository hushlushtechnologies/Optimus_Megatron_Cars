"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { getBreadcrumbs, getPageTitle } from "@/src/lib/utils/get-breadcrumbs";
import { IconButton } from "@/src/components/ui/icon-button";

export function PageHeading() {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = getBreadcrumbs(pathname);
  const title = getPageTitle(pathname);
  const showBackButton = pathname !== "/admin";

  return (
    <div className="flex min-w-0 items-center gap-3">
      {showBackButton && (
        <IconButton
          aria-label="Go back"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </IconButton>
      )}
      <div className="min-w-0">
        <h1 className="text-h3 lg:text-h2 truncate">{title}</h1>
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="text-caption flex items-center gap-1.5">
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {index > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
                  {isLast ? (
                    <span aria-current="page" className="text-text-muted">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-text-primary transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
