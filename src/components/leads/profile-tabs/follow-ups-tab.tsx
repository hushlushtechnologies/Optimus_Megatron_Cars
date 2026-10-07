"use client";

import { useEffect, useState } from "react";

import { FollowUpList } from "@/src/components/leads/follow-up-list";

import { getLeadFollowUpsAction } from "@/app/admin/leads/[id]/follow-up-actions";

import type { LeadFollowUp } from "@/src/lib/types/lead";

/* =========================================================
   TYPES
========================================================= */

interface FollowUpsTabProps {
  leadId: string;
}

interface FollowUpsState {
  leadId: string | null;

  followUps: LeadFollowUp[];

  error: string | null;
}

/* =========================================================
   COMPONENT
========================================================= */

export function FollowUpsTab({ leadId }: FollowUpsTabProps) {
  const [state, setState] = useState<FollowUpsState>({
    leadId: null,
    followUps: [],
    error: null,
  });

  /* =========================================================
     LOAD FOLLOW-UPS
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    getLeadFollowUpsAction(leadId)
      .then((followUps) => {
        if (cancelled) {
          return;
        }

        setState({
          leadId,
          followUps,
          error: null,
        });
      })
      .catch((error: unknown) => {
        console.error("Unable to load follow-ups:", error);

        if (cancelled) {
          return;
        }

        setState({
          leadId,
          followUps: [],
          error: "Unable to load follow-ups.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  /* =========================================================
     DERIVED STATE
  ========================================================= */

  const isLoading = state.leadId !== leadId;

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <div className="py-6">
        <p className="text-body-sm text-text-muted">Loading follow-ups...</p>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (state.error) {
    return (
      <div className="py-6">
        <p className="text-body-sm text-destructive">{state.error}</p>
      </div>
    );
  }

  /* =========================================================
     LIST
  ========================================================= */

  return <FollowUpList leadId={leadId} followUps={state.followUps} />;
}
