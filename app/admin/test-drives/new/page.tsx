import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { requireTestDrivePermission } from "@/src/lib/supabase/test-drive-permissions";
import { getTestDriveFormLookups, getTestDriveFormPrefill } from "@/src/lib/supabase/test-drive-form-queries";
import { AddTestDriveForm } from "@/src/components/test-drives/form/add-test-drive-form";

interface NewTestDrivePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="surface-card flex max-w-2xl items-start gap-3 p-5">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
      <div>
        <p className="text-body-sm text-text-primary font-medium">{title}</p>
        <div className="text-body-sm text-text-muted mt-1">{children}</div>
        <Link
          href="/admin/test-drives"
          className="text-body-sm text-primary-text hover:text-primary-hover mt-3 inline-block"
        >
          Back to Test Drives
        </Link>
      </div>
    </div>
  );
}

export default async function NewTestDrivePage({ searchParams }: NewTestDrivePageProps) {
  const permission = await requireTestDrivePermission("create");
  if (!permission.allowed) {
    return (
      <Notice title="You don't have permission to create test drives.">
        Ask an administrator if you need access.
      </Notice>
    );
  }

  const params = await searchParams;
  const [lookups, prefill] = await Promise.all([getTestDriveFormLookups(), getTestDriveFormPrefill(params)]);

  if (!lookups) {
    return (
      <Notice title="The form couldn't be loaded.">
        Nothing has been lost. Refresh the page to try again, and let someone know if it keeps happening.
      </Notice>
    );
  }

  if (lookups.showrooms.length === 0) {
    return (
      <Notice title="No showrooms are set up for test drives yet.">
        Turn on at least one showroom for test drives before creating a request.
      </Notice>
    );
  }

  return <AddTestDriveForm lookups={lookups} prefill={prefill} />;
}
