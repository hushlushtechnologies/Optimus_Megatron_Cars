"use client";

import { History, Tag as TagIcon } from "lucide-react";
import { DetailSection, DetailRow } from "@/src/components/inventory/view-car/detail-row";
import { LeadStatusBadge } from "@/src/components/leads/lead-status-badge";
import { LeadTagPill } from "@/src/components/leads/lead-tag-pill";
import { TemperatureSelector } from "@/src/components/leads/temperature-selector";
import type { LeadSummary, LeadTemperature } from "@/src/lib/types/lead";

interface OverviewTabProps {
  lead: LeadSummary;
  onViewAssignmentHistory?: () => void;
  onTemperatureChanged: (next: LeadTemperature) => void;
  onManageTags?: () => void;
}

export function OverviewTab({
  lead,
  onViewAssignmentHistory,
  onTemperatureChanged,
  onManageTags,
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DetailSection title="Pipeline">
        <DetailRow label="Stage" value={lead.stage.name} />
        <DetailRow label="Status" value={<LeadStatusBadge stageType={lead.stage.stage_type} />} />
        <DetailRow
          label="Temperature"
          value={
            <TemperatureSelector leadId={lead.id} value={lead.temperature} onChanged={onTemperatureChanged} />
          }
        />
        <DetailRow label="Source" value={lead.source_name ?? "—"} />
        {lead.source_detail && <DetailRow label="Source Detail" value={lead.source_detail} />}
        <DetailRow
          label="Assigned Staff"
          value={
            <span className="flex items-center gap-2">
              {lead.assigned_staff_name ?? "Unassigned"}
              {onViewAssignmentHistory && (
                <button
                  type="button"
                  onClick={onViewAssignmentHistory}
                  aria-label="View assignment history"
                  className="text-text-subtle hover:text-primary-text"
                >
                  <History className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          }
        />
      </DetailSection>

      <DetailSection title="Timeline">
        <DetailRow label="Created" value={new Date(lead.created_at).toLocaleString()} />
        <DetailRow
          label="Last Activity"
          value={lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleString() : "—"}
        />
        <DetailRow
          label="Next Follow-Up"
          value={
            lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : "None scheduled"
          }
        />
      </DetailSection>

      <div className="surface-card p-5 lg:col-span-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-label">Tags</p>
          {onManageTags && (
            <button
              type="button"
              onClick={onManageTags}
              className="text-body-sm text-primary-text hover:text-primary-hover flex items-center gap-1.5"
            >
              <TagIcon className="size-3.5" aria-hidden="true" />
              Manage
            </button>
          )}
        </div>
        {lead.tags.length === 0 ? (
          <p className="text-body-sm text-text-muted">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lead.tags.map((tag) => (
              <LeadTagPill key={tag.id} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
