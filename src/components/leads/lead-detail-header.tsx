"use client";

import {
  Pencil,
  UserCog,
  ArrowRightLeft,
  CalendarPlus,
  StickyNote,
  Tag,
  Trophy,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { IconButton } from "@/src/components/ui/icon-button";
import { Button } from "@/src/components/ui/button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { LeadTemperatureBadge } from "@/src/components/leads/lead-temperature-badge";
import type { LeadSummary } from "@/src/lib/types/lead";

interface LeadDetailHeaderProps {
  lead: LeadSummary;
  onEdit?: () => void;
  onAssignStaff?: () => void;
  onMoveStage?: () => void;
  onScheduleFollowUp?: () => void;
  onAddNote?: () => void;
  onAddTag?: () => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
}

export function LeadDetailHeader({
  lead,
  onEdit,
  onAssignStaff,
  onMoveStage,
  onScheduleFollowUp,
  onAddNote,
  onAddTag,
  onMarkWon,
  onMarkLost,
}: LeadDetailHeaderProps) {
  const isOpen = lead.stage.stage_type === "open";

  return (
    <div className="surface-card flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-caption text-text-subtle">{lead.lead_number}</p>
          <h1 className="text-h2 text-text-primary truncate">{lead.customer.full_name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className="text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              style={{
                backgroundColor: `${lead.stage.color_hex}1A`,
                borderColor: `${lead.stage.color_hex}66`,
                color: lead.stage.color_hex,
              }}
            >
              {lead.stage.name}
            </span>
            <LeadTemperatureBadge temperature={lead.temperature} />
            {lead.source_name && (
              <span className="text-caption text-text-subtle">via {lead.source_name}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={onEdit}>
            Edit
          </Button>
          <Button size="sm" leftIcon={<ArrowRightLeft className="size-3.5" />} onClick={onMoveStage}>
            Move Stage
          </Button>
          {isOpen && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                leftIcon={<Trophy className="size-3.5" />}
                onClick={onMarkWon}
              >
                Mark Won
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                leftIcon={<XCircle className="size-3.5" />}
                onClick={onMarkLost}
              >
                Mark Lost
              </Button>
            </>
          )}
          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label="More actions" variant="outline" size="sm">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-52 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={onAssignStaff}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <UserCog className="text-text-muted size-4" aria-hidden="true" />
                Assign Staff
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onScheduleFollowUp}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <CalendarPlus className="text-text-muted size-4" aria-hidden="true" />
                Schedule Follow-Up
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onAddNote}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <StickyNote className="text-text-muted size-4" aria-hidden="true" />
                Add Note
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onAddTag}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left"
              >
                <Tag className="text-text-muted size-4" aria-hidden="true" />
                Add Tag
              </button>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
