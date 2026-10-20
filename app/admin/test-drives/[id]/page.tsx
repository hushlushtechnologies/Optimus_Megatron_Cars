import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { currentUserTestDrivePermissions } from "@/src/lib/supabase/test-drive-permissions";
import { getTestDriveDetail } from "@/src/lib/supabase/test-drive-detail-queries";
import { getTestDriveFeedback } from "@/src/lib/supabase/test-drive-feedback-queries";
import { getFollowUpsForTestDrive } from "@/src/lib/supabase/test-drive-panel-queries";
import { isUuid } from "@/src/lib/utils/search-term";
import { TestDriveDetailClient } from "@/src/components/test-drives/detail/test-drive-detail-client";

interface TestDriveDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestDriveDetailPage({ params }: TestDriveDetailPageProps) {
  const { id } = await params;

  // Anything that isn't a real ID can't exist, so don't even ask the database.
  if (!isUuid(id)) notFound();

  const [result, permissions, feedback, followUps] = await Promise.all([
    getTestDriveDetail(id),
    currentUserTestDrivePermissions(),
    getTestDriveFeedback(id),
    getFollowUpsForTestDrive(id),
  ]);

  if (result.status === "not_found") notFound();

  if (result.status === "error") {
    return (
      <div role="alert" className="surface-card flex max-w-2xl items-start gap-3 p-5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div>
          <p className="text-body-sm text-text-primary font-medium">
            This test drive couldn&apos;t be loaded.
          </p>
          <p className="text-body-sm text-text-muted mt-1">
            Nothing has been lost. Refresh the page to try again, and let someone know if it keeps happening.
          </p>
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

  return (
    <TestDriveDetailClient
      data={result.data}
      permissions={permissions}
      feedback={feedback}
      followUps={followUps}
    />
  );
}
