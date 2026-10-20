"use client";

import Link from "next/link";
import { memo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CarFront,
  Clock3,
  MoreHorizontal,
  Trophy,
  UserRound,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow, isPast, isValid } from "date-fns";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { LeadTemperatureBadge } from "@/src/components/leads/lead-temperature-badge";
import { LeadTagPill } from "@/src/components/leads/lead-tag-pill";
import { cn } from "@/src/lib/utils/cn";
import type { LeadStage, LeadSummary } from "@/src/lib/types/lead";

interface LeadCardProps {
  lead: LeadSummary;
  className?: string;
  stages?: LeadStage[];
  onMoveToStage?: (stageId: string) => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
}

export const LeadCard = memo(function LeadCard({
  lead,
  className,
  stages,
  onMoveToStage,
  onMarkWon,
  onMarkLost,
}: LeadCardProps) {
  const isOpen = lead.stage.stage_type === "open";
  const openStages =
    stages?.filter((stage) => stage.stage_type === "open" && stage.id !== lead.stage.id) ?? [];
  const canMove = !!onMoveToStage && openStages.length > 0;
  const canClose = isOpen && (!!onMarkWon || !!onMarkLost);
  const followUp = lead.next_follow_up_at ? new Date(lead.next_follow_up_at) : null;
  const validFollowUp = followUp && isValid(followUp) ? followUp : null;
  const overdue = validFollowUp ? isPast(validFollowUp) && isOpen : false;
  const created = new Date(lead.created_at);
  const createdLabel = isValid(created) ? formatDistanceToNow(created, { addSuffix: true }) : "Recently";

  return (
    <article
      className={cn(
        "group border-border bg-card relative overflow-hidden rounded-lg border p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow,transform] duration-150",
        "hover:border-primary/35 focus-within:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_7px_22px_rgba(0,0,0,0.12)]",
        overdue && "border-l-danger border-l-[3px]",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/leads/${lead.id}`}
            className="group/link focus-visible:outline-primary block min-w-0 rounded-sm focus-visible:outline-2"
          >
            <span className="text-text-subtle block truncate text-[10px] font-medium tracking-wide">
              {lead.lead_number}
            </span>
            <span className="text-text-primary group-hover/link:text-primary mt-0.5 flex items-center gap-1 truncate text-[13px] font-semibold transition-colors">
              <span className="truncate">{lead.customer.full_name}</span>
              <ArrowUpRight
                className="size-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
        {(canMove || canClose) && (
          <Dropdown>
            <DropdownTrigger>
              <button
                type="button"
                aria-label={`Actions for ${lead.lead_number}`}
                className="text-text-muted hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-2"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-52 py-1">
              {canMove && (
                <>
                  <p className="text-text-subtle px-3 py-1.5 text-[11px] font-medium">
                    {isOpen ? "Move to stage" : "Reopen in stage"}
                  </p>
                  {openStages.map((stage) => (
                    <button
                      key={stage.id}
                      type="button"
                      role="menuitem"
                      onClick={() => onMoveToStage?.(stage.id)}
                      className="text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs"
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: stage.color_hex }} />
                      {stage.name}
                    </button>
                  ))}
                </>
              )}
              {canClose && (
                <>
                  <div className="border-border my-1 border-t" role="separator" />
                  {onMarkWon && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onMarkWon}
                      className="text-text-primary hover:bg-card-hover flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                    >
                      <Trophy className="text-success size-4" />
                      Mark as Won…
                    </button>
                  )}
                  {onMarkLost && (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onMarkLost}
                      className="text-text-primary hover:bg-card-hover flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
                    >
                      <XCircle className="text-danger size-4" />
                      Mark as Lost…
                    </button>
                  )}
                </>
              )}
            </DropdownContent>
          </Dropdown>
        )}
      </div>

      <div className="mb-2.5 flex items-center justify-between gap-2">
        <LeadTemperatureBadge temperature={lead.temperature} />
        {validFollowUp && (
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1 truncate text-[10px] font-medium",
              overdue ? "text-danger" : "text-text-muted",
            )}
            title={validFollowUp.toLocaleString()}
          >
            {overdue ? <AlertTriangle className="size-3 shrink-0" /> : <Clock3 className="size-3 shrink-0" />}
            <span className="truncate">
              {overdue ? "Overdue" : "Follow-up"} {formatDistanceToNow(validFollowUp, { addSuffix: true })}
            </span>
          </span>
        )}
      </div>

      <div className="bg-card-hover/70 text-text-muted flex min-w-0 items-center gap-2 rounded-md px-2.5 py-2 text-[11px]">
        <CarFront className="text-text-subtle size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{lead.vehicle?.display_title ?? "Vehicle not selected"}</span>
      </div>

      {lead.tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          {lead.tags.slice(0, 2).map((tag) => (
            <LeadTagPill key={tag.id} tag={tag} />
          ))}
          {lead.tags.length > 2 && (
            <span className="text-text-subtle text-[10px]">+{lead.tags.length - 2}</span>
          )}
        </div>
      )}

      <div className="border-border mt-3 flex items-center justify-between gap-2 border-t pt-2.5">
        <div
          className="text-text-muted flex min-w-0 items-center gap-1.5 text-[10px]"
          title={lead.assigned_staff_name ?? "Unassigned"}
        >
          <span className="bg-primary/10 text-primary flex size-5 shrink-0 items-center justify-center rounded-full">
            <UserRound className="size-3" />
          </span>
          <span className="truncate">{lead.assigned_staff_name ?? "Unassigned"}</span>
        </div>
        <span className="text-text-subtle shrink-0 text-[10px]" title={`Created ${createdLabel}`}>
          {createdLabel}
        </span>
      </div>
      {lead.source_name && (
        <p className="text-text-subtle mt-1.5 truncate text-[10px]">Source: {lead.source_name}</p>
      )}
    </article>
  );
});
