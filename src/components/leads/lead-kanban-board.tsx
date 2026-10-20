"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type Announcements,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, GripVertical, Info, Layers3 } from "lucide-react";
import { LeadPipeline } from "@/src/components/leads/lead-pipeline";
import { LeadStageColumn } from "@/src/components/leads/lead-stage-column";
import { LeadCard } from "@/src/components/leads/lead-card";
import { MarkWonDialog } from "@/src/components/leads/mark-won-dialog";
import { MarkLostDialog } from "@/src/components/leads/mark-lost-dialog";
import { moveLeadStage } from "@/app/admin/leads/actions";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import { KANBAN_OPEN_LEAD_CAP } from "@/src/lib/utils/lead-limits";
import type { LeadLostReason, LeadStage, LeadSummary } from "@/src/lib/types/lead";

interface LeadKanbanBoardProps {
  stages: LeadStage[];
  initialLeadsByStage: Record<string, LeadSummary[]>;
  stageTotals: Record<string, number>;
  openTruncated: boolean;
  lostReasons: LeadLostReason[];
}
type LeadsByStage = Record<string, LeadSummary[]>;
type PendingClose = { lead: LeadSummary; outcome: "won" | "lost" };

function findStageOfLead(state: LeadsByStage, id: string) {
  return Object.keys(state).find((stageId) => (state[stageId] ?? []).some((lead) => lead.id === id));
}
function moveLead(state: LeadsByStage, id: string, destination: LeadStage): LeadsByStage {
  const from = findStageOfLead(state, id);
  if (!from || from === destination.id) return state;
  const lead = state[from].find((item) => item.id === id);
  if (!lead) return state;
  return {
    ...state,
    [from]: state[from].filter((item) => item.id !== id),
    [destination.id]: [{ ...lead, stage: destination }, ...(state[destination.id] ?? [])],
  };
}

export function LeadKanbanBoard({
  stages,
  initialLeadsByStage,
  stageTotals,
  openTruncated,
  lostReasons,
}: LeadKanbanBoardProps) {
  const [leadsByStage, setLeadsByStage] = useState<LeadsByStage>(initialLeadsByStage);
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
  const [overStageId, setOverStageId] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [countsDelta, setCountsDelta] = useState<Record<string, number>>({});
  const boardRef = useRef(leadsByStage);
  const busyIds = useRef(new Set<string>());
  const dndId = useId();
  const reducedMotion = useReducedMotion();
  const stagesById = useMemo(() => new Map(stages.map((stage) => [stage.id, stage])), [stages]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    boardRef.current = leadsByStage;
  }, [leadsByStage]);

  const stageForTarget = useCallback(
    (id: string | null) => {
      if (!id) return null;
      if (stagesById.has(id)) return id;
      return findStageOfLead(boardRef.current, id) ?? null;
    },
    [stagesById],
  );

  const updateCount = (fromId: string, toId: string) => {
    setCountsDelta((previous) => ({
      ...previous,
      [fromId]: (previous[fromId] ?? 0) - 1,
      [toId]: (previous[toId] ?? 0) + 1,
    }));
  };

  const commitMove = useCallback(
    async (lead: LeadSummary, destination: LeadStage) => {
      const current = boardRef.current;
      const fromId = findStageOfLead(current, lead.id);
      if (!fromId || fromId === destination.id || busyIds.current.has(lead.id)) return;
      busyIds.current.add(lead.id);
      const snapshot = current;
      const optimistic = moveLead(snapshot, lead.id, destination);
      boardRef.current = optimistic;
      setLeadsByStage(optimistic);
      updateCount(fromId, destination.id);
      try {
        const result = await moveLeadStage(lead.id, destination.id);
        if (result.error) throw new Error(result.error);
        toast.success(`Moved to ${destination.name}`);
      } catch (error) {
        // Restore this lead only, rather than replacing unrelated moves made in the meantime.
        const origin = stagesById.get(fromId);
        if (origin) {
          const restored = moveLead(boardRef.current, lead.id, origin);
          boardRef.current = restored;
          setLeadsByStage(restored);
          updateCount(destination.id, fromId);
        }
        toast.error(error instanceof Error ? error.message : "Could not update lead stage");
      } finally {
        busyIds.current.delete(lead.id);
      }
    },
    [stagesById],
  );

  const requestMove = useCallback(
    (lead: LeadSummary, destinationId: string) => {
      const destination = stagesById.get(destinationId);
      const currentId = findStageOfLead(boardRef.current, lead.id);
      if (!destination || !currentId || currentId === destination.id) return;
      const currentStage = stagesById.get(currentId);
      if (destination.stage_type !== "open") {
        if (currentStage?.stage_type !== "open") {
          toast.error("Reopen this lead before closing it again.");
          return;
        }
        setPendingClose({ lead, outcome: destination.stage_type === "won" ? "won" : "lost" });
        return;
      }
      void commitMove(lead, destination);
    },
    [commitMove, stagesById],
  );

  const handleMoveToStage = useCallback(
    (lead: LeadSummary, id: string) => requestMove(lead, id),
    [requestMove],
  );
  const handleMarkWon = useCallback((lead: LeadSummary) => {
    setPendingClose({ lead, outcome: "won" });
  }, []);
  const handleMarkLost = useCallback((lead: LeadSummary) => {
    setPendingClose({ lead, outcome: "lost" });
  }, []);

  function onDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const from = findStageOfLead(boardRef.current, id);
    const lead = from ? boardRef.current[from]?.find((item) => item.id === id) : null;
    setActiveLead(lead ?? null);
  }
  function onDragOver(event: DragOverEvent) {
    setOverStageId(stageForTarget(event.over ? String(event.over.id) : null));
  }
  function onDragEnd(event: DragEndEvent) {
    const target = stageForTarget(event.over ? String(event.over.id) : null);
    const lead = activeLead;
    setActiveLead(null);
    setOverStageId(null);
    if (!lead || !target) return;
    const source = findStageOfLead(boardRef.current, lead.id);
    if (source !== target) {
      requestMove(lead, target);
      return;
    }
    const overId = String(event.over?.id ?? "");
    if (overId === lead.id || overId === target) return;
    setLeadsByStage((previous) => {
      const items = previous[target] ?? [];
      const from = items.findIndex((item) => item.id === lead.id);
      const to = items.findIndex((item) => item.id === overId);
      if (from < 0 || to < 0 || from === to) return previous;
      const next = { ...previous, [target]: arrayMove(items, from, to) };
      boardRef.current = next;
      return next;
    });
    // Same-stage ordering is visual only; persistence requires a dedicated ordering API.
  }
  function onDragCancel() {
    setActiveLead(null);
    setOverStageId(null);
  }

  function handleCloseSucceeded() {
    if (!pendingClose) return;
    const destination = stages.find((stage) => stage.stage_type === pendingClose.outcome);
    if (!destination) return;
    const fromId = findStageOfLead(boardRef.current, pendingClose.lead.id);
    if (!fromId || fromId === destination.id) return;
    const next = moveLead(boardRef.current, pendingClose.lead.id, destination);
    boardRef.current = next;
    setLeadsByStage(next);
    updateCount(fromId, destination.id);
  }
  function dismissClose() {
    setPendingClose(null);
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up lead ${String(active.id)}.`,
    onDragOver: ({ over }) =>
      over
        ? `Over ${stagesById.get(stageForTarget(String(over.id)) ?? "")?.name ?? "lead"}.`
        : "Outside a stage.",
    onDragEnd: ({ over }) => (over ? "Lead dropped." : "Lead returned to its stage."),
    onDragCancel: () => "Lead move cancelled.",
  };

  const totalOpen = stages
    .filter((stage) => stage.stage_type === "open")
    .reduce((sum, stage) => sum + (stageTotals[stage.id] ?? 0) + (countsDelta[stage.id] ?? 0), 0);
  const loadedOpen = stages
    .filter((stage) => stage.stage_type === "open")
    .reduce((sum, stage) => sum + (leadsByStage[stage.id]?.length ?? 0), 0);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="border-primary/20 bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg border">
            <Layers3 className="size-4" />
          </span>
          <div>
            <h2 className="text-text-primary text-sm font-semibold">Pipeline board</h2>
            <p className="text-text-muted text-[11px]">
              {totalOpen.toLocaleString()} open leads · {loadedOpen.toLocaleString()} currently loaded
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((value) => !value)}
          aria-expanded={showHelp}
          className="text-text-muted hover:bg-card-hover hover:text-text-primary focus-visible:outline-primary inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-2"
        >
          <Info className="size-3.5" />
          How to use
        </button>
      </div>
      {showHelp && (
        <div className="border-border bg-card-hover/50 text-text-muted rounded-lg border px-3 py-2.5 text-xs leading-relaxed">
          Drag using the grip handle or use a leads actions menu to change stages. Keyboard: focus the grip,
          press Space, use arrow keys, then press Space again. Won and Lost always require confirmation.
        </div>
      )}
      {openTruncated && (
        <div
          role="status"
          className="border-warning/30 bg-warning/10 text-text-primary flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs"
        >
          <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
          Showing up to {KANBAN_OPEN_LEAD_CAP} open leads. Use filters or Table view to browse the full
          pipeline.
        </div>
      )}

      <DndContext
        id={`lead-kanban-${dndId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Press Space to pick up a lead, use arrow keys to move, Space to drop, or Escape to cancel.",
          },
        }}
      >
        <LeadPipeline>
          {stages.map((stage) => {
            const items = leadsByStage[stage.id] ?? [];
            const total = Math.max(0, (stageTotals[stage.id] ?? 0) + (countsDelta[stage.id] ?? 0));
            const isTarget = !!activeLead && overStageId === stage.id;
            return (
              <LeadStageColumn
                key={stage.id}
                stage={stage}
                count={total}
                isDragging={!!activeLead}
                isDropTarget={isTarget}
                footer={
                  total > items.length ? (
                    <p className="text-text-subtle text-[11px]">
                      Showing {items.length} of {total.toLocaleString()} · See Table view for more
                    </p>
                  ) : undefined
                }
              >
                <DroppableColumnBody stageId={stage.id} isTarget={isTarget} empty={items.length === 0}>
                  <SortableContext
                    items={items.map((lead) => lead.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        stages={stages}
                        onMoveToStage={handleMoveToStage}
                        onMarkWon={handleMarkWon}
                        onMarkLost={handleMarkLost}
                      />
                    ))}
                  </SortableContext>
                </DroppableColumnBody>
              </LeadStageColumn>
            );
          })}
        </LeadPipeline>
        <DragOverlay dropAnimation={reducedMotion ? null : undefined}>
          {activeLead ? (
            <div className="w-[292px] rotate-[1deg] cursor-grabbing opacity-95 shadow-2xl">
              <LeadCard lead={activeLead} className="border-primary/60 ring-primary/20 ring-2" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <MarkWonDialog
        isOpen={pendingClose?.outcome === "won"}
        onClose={dismissClose}
        leadId={pendingClose?.lead.id ?? ""}
        onMarked={handleCloseSucceeded}
      />
      <MarkLostDialog
        isOpen={pendingClose?.outcome === "lost"}
        onClose={dismissClose}
        leadId={pendingClose?.lead.id ?? ""}
        reasons={lostReasons}
        onMarked={handleCloseSucceeded}
      />
    </div>
  );
}

function DroppableColumnBody({
  stageId,
  isTarget,
  empty,
  children,
}: {
  stageId: string;
  isTarget: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: stageId });
  return (
    <div ref={setNodeRef} className="flex min-h-24 flex-col gap-2.5">
      {children}
      {empty && (
        <div
          className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-3 text-center transition-colors ${isTarget ? "border-primary/70 bg-primary/10 text-primary" : "border-border text-text-subtle"}`}
        >
          <Layers3 className="size-5 opacity-60" />
          <span className="text-xs font-medium">
            {isTarget ? "Drop lead here" : "No leads in this stage"}
          </span>
          <span className="text-[10px] opacity-75">Drag a lead here to move it</span>
        </div>
      )}
    </div>
  );
}

const SortableLeadCard = memo(function SortableLeadCard({
  lead,
  stages,
  onMoveToStage,
  onMarkWon,
  onMarkLost,
}: {
  lead: LeadSummary;
  stages: LeadStage[];
  onMoveToStage: (lead: LeadSummary, id: string) => void;
  onMarkWon: (lead: LeadSummary) => void;
  onMarkLost: (lead: LeadSummary) => void;
}) {
  const reducedMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: reducedMotion ? undefined : transition,
    opacity: isDragging ? 0.25 : 1,
  };
  const move = useCallback((id: string) => onMoveToStage(lead, id), [lead, onMoveToStage]);
  const won = useCallback(() => onMarkWon(lead), [lead, onMarkWon]);
  const lost = useCallback(() => onMarkLost(lead), [lead, onMarkLost]);
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${lead.lead_number} to another stage`}
        className="text-text-subtle hover:bg-card-hover hover:text-primary focus-visible:outline-primary absolute top-3 left-1 z-10 flex size-7 cursor-grab touch-none items-center justify-center rounded-md transition-colors focus-visible:outline-2 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <LeadCard
        lead={lead}
        stages={stages}
        onMoveToStage={move}
        onMarkWon={won}
        onMarkLost={lost}
        className="pl-9"
      />
    </div>
  );
});
