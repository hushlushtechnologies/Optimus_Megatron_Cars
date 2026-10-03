"use client";

import { EmptyState } from "@/src/components/shared/empty-state";
import { ErrorState } from "@/src/components/shared/error-state";
import { UnauthorizedState } from "@/src/components/shared/unauthorized-state";
import { SuccessState } from "@/src/components/shared/success-state";
import { LoadingState } from "@/src/components/shared/loading-state";
import { NoSearchResults } from "@/src/components/shared/no-search-results";
import { Card } from "@/src/components/ui/card";
import { Divider } from "@/src/components/ui/divider";

export default function StatesPreviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-h1">State Components Preview</h1>
      <p className="text-body-sm text-text-muted">
        Temporary page delete once youve confirmed everything renders correctly
      </p>

      <Card>
        <EmptyState
          title="No vehicles yet"
          description="Add your first vehicle to get started."
          action={{
            label: "Add Something",
            href: "/admin",
          }}
        />
      </Card>
      <Divider label="ERROR" />
      <Card>
        <ErrorState onRetry={() => alert("Retried")} />
      </Card>
      <Divider label="NETWORK ERROR" />
      <Card>
        <ErrorState variant="network" onRetry={() => alert("Retried")} />
      </Card>
      <Divider label="UNAUTHORIZED" />
      <Card>
        <UnauthorizedState />
      </Card>
      <Divider label="SUCCESS" />
      <Card>
        <SuccessState title="Reservation confirmed" description="AED 25000 token payment received." />
      </Card>
      <Divider label="LOADING" />
      <Card>
        <LoadingState />
      </Card>
      <Divider label="NO SEARCH RESULTS" />
      <Card>
        <NoSearchResults query="Lamborghini Diablo" />
      </Card>
    </div>
  );
}
