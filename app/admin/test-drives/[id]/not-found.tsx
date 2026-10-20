import Link from "next/link";
import { SearchX } from "lucide-react";

export default function TestDriveNotFound() {
  return (
    <div className="surface-card mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
      <SearchX className="text-text-subtle size-8" aria-hidden="true" />
      <div>
        <h1 className="text-h2">Test drive not found</h1>
        <p className="text-body-sm text-text-muted mt-1">
          This test drive doesn&apos;t exist, or the link is wrong. It may have been mistyped.
        </p>
      </div>
      <Link
        href="/admin/test-drives"
        className="bg-primary text-body hover:bg-primary-hover inline-flex h-10 items-center justify-center rounded-md px-4 text-[#0b1220] transition-colors"
      >
        Back to Test Drives
      </Link>
    </div>
  );
}
