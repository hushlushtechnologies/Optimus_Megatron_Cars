"use client";

import {
  memo,
  useCallback,
  useEffect,
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
  closestCenter,
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
import { GripVertical, Info, TriangleAlert } from "lucide-react";
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

interface PendingClose {
  lead: LeadSummary;
  outcome: "won" | "lost";
  snapshot: LeadsByStage;
  /** Menu path: the card hasn't moved yet. Drag path: it already has. */
  moveOnSuccess: boolean;
}

function withStage(lead: LeadSummary, stage: LeadStage): LeadSummary {
  return lead.stage.id === stage.id ? lead : { ...lead, stage };
}

function applyMove(
  prev: LeadsByStage,
  leadId: string,
  fromStageId: string,
  toStage: LeadStage,
): LeadsByStage {
  const fromItems = prev[fromStageId] ?? [];
  const lead = fromItems.find((l) => l.id === leadId);
  if (!lead) return prev;

  return {
    ...prev,
    [fromStageId]: fromItems.filter((l) => l.id !== leadId),
    [toStage.id]: [withStage(lead, toStage), ...(prev[toStage.id] ?? [])],
  };
}

export function LeadKanbanBoard({
  stages,
  initialLeadsByStage,
  stageTotals,
  openTruncated,
  lostReasons,
}: LeadKanbanBoardProps) {
  const [leadsByStage, setLeadsByStage] = useState(initialLeadsByStage);
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const stagesById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);

  // How many leads each column held when it loaded, so a live move can adjust
  // the true total shown in the header (closed columns load only a slice).
  const [initialLengths] = useState(() =>
    Object.fromEntries(Object.entries(initialLeadsByStage).map(([id, list]) => [id, list.length])),
  );

  const snapshotRef = useRef<LeadsByStage | null>(null);
  const startContainerRef = useRef<string | null>(null);
  const currentContainerRef = useRef<string | null>(null);
  const closeSucceededRef = useRef(false);

  // Always holds the latest board, so the stable handlers below can take an
  // accurate "before" snapshot without having to change identity every render.
  const latestRef = useRef(leadsByStage);
  useEffect(() => {
    latestRef.current = leadsByStage;
  }, [leadsByStage]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const displayCount = (stageId: string) =>
    (stageTotals[stageId] ?? 0) + (leadsByStage[stageId]?.length ?? 0) - (initialLengths[stageId] ?? 0);

  function findContainer(id: string, state: LeadsByStage = leadsByStage): string | undefined {
    if (id in state) return id;
    return Object.keys(state).find((stageId) => state[stageId].some((l) => l.id === id));
  }

  function describeLead(id: string): string {
    for (const stageId of Object.keys(leadsByStage)) {
      const lead = leadsByStage[stageId].find((l) => l.id === id);
      if (lead) return `${lead.lead_number}, ${lead.customer.full_name}`;
    }
    return "lead";
  }

  function stageNameFor(id: string): string {
    const container = findContainer(id);
    return stagesById.get(container ?? "")?.name ?? "an unknown stage";
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up lead ${describeLead(String(active.id))} from ${stageNameFor(String(active.id))}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Lead ${describeLead(String(active.id))} is over ${stageNameFor(String(over.id))}.`
        : `Lead ${describeLead(String(active.id))} is not over a stage.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped lead ${describeLead(String(active.id))} in ${stageNameFor(String(over.id))}.`
        : `Lead ${describeLead(String(active.id))} was returned to its original stage.`,
    onDragCancel: ({ active }) =>
      `Move cancelled. Lead ${describeLead(String(active.id))} stays in its original stage.`,
  };

  function resetGesture() {
    snapshotRef.current = null;
    startContainerRef.current = null;
    currentContainerRef.current = null;
    setActiveLead(null);
  }

  const persist = useCallback(
    async (leadId: string, toStageId: string, snapshot: LeadsByStage) => {
      const result = await moveLeadStage(leadId, toStageId);
      if (result.error) {
        setLeadsByStage(snapshot);
        toast.error(result.error);
        return;
      }
      const newStage = stagesById.get(toStageId);
      if (newStage) toast.success(`Lead moved to ${newStage.name}`);
    },
    [stagesById],
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const container = findContainer(id);
    if (!container) return;

    snapshotRef.current = leadsByStage;
    startContainerRef.current = container;
    currentContainerRef.current = container;
    setActiveLead(leadsByStage[container].find((l) => l.id === id) ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const overStage = stagesById.get(overContainer);

    setLeadsByStage((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((l) => l.id === activeId);
      if (activeIndex === -1) return prev;

      // The moved card gets its new stage object straight away, so its menu
      // never offers the column it's already in.
      const moved = overStage ? withStage(activeItems[activeIndex], overStage) : activeItems[activeIndex];
      const overIndex = overItems.findIndex((l) => l.id === overId);
      const newOverItems = [...overItems];
      newOverItems.splice(overIndex >= 0 ? overIndex : newOverItems.length, 0, moved);

      return {
        ...prev,
        [activeContainer]: activeItems.filter((l) => l.id !== activeId),
        [overContainer]: newOverItems,
      };
    });

    currentContainerRef.current = overContainer;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const startContainer = startContainerRef.current;
    const endContainer = currentContainerRef.current;
    const snapshot = snapshotRef.current;

    resetGesture();

    if (!startContainer || !endContainer || !snapshot) return;

    if (!over) {
      setLeadsByStage(snapshot);
      return;
    }

    if (endContainer !== startContainer) {
      const fromStage = stagesById.get(startContainer);
      const toStage = stagesById.get(endContainer);

      // Closing a deal needs its outcome (and a reason, for Lost), so a drop
      // on Won or Lost opens that dialog instead of saving a bare move.
      if (toStage && toStage.stage_type !== "open") {
        if (fromStage?.stage_type !== "open") {
          setLeadsByStage(snapshot);
          toast.error("Reopen this lead before closing it again.");
          return;
        }
        const lead = leadsByStage[endContainer]?.find((l) => l.id === activeId);
        if (!lead) {
          setLeadsByStage(snapshot);
          return;
        }
        closeSucceededRef.current = false;
        setPendingClose({
          lead,
          outcome: toStage.stage_type === "won" ? "won" : "lost",
          snapshot,
          moveOnSuccess: false,
        });
        return;
      }

      void persist(activeId, endContainer, snapshot);
      return;
    }

    const overId = String(over.id);
    setLeadsByStage((prev) => {
      const items = prev[startContainer];
      const oldIndex = items.findIndex((l) => l.id === activeId);
      const newIndex = items.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [startContainer]: arrayMove(items, oldIndex, newIndex) };
    });
  }

  function handleDragCancel() {
    if (snapshotRef.current) setLeadsByStage(snapshotRef.current);
    resetGesture();
  }

  // Stable across renders, so memoized cards aren't re-rendered during a drag.
  const handleMoveToStage = useCallback(
    (lead: LeadSummary, toStageId: string) => {
      const toStage = stagesById.get(toStageId);
      if (!toStage || toStageId === lead.stage.id) return;
      const snapshot = latestRef.current;
      setLeadsByStage((prev) => applyMove(prev, lead.id, lead.stage.id, toStage));
      void persist(lead.id, toStageId, snapshot);
    },
    [persist, stagesById],
  );

  const handleMarkWon = useCallback((lead: LeadSummary) => {
    closeSucceededRef.current = false;
    setPendingClose({ lead, outcome: "won", snapshot: latestRef.current, moveOnSuccess: true });
  }, []);

  const handleMarkLost = useCallback((lead: LeadSummary) => {
    closeSucceededRef.current = false;
    setPendingClose({ lead, outcome: "lost", snapshot: latestRef.current, moveOnSuccess: true });
  }, []);

  function handleCloseSucceeded() {
    closeSucceededRef.current = true;
    if (pendingClose?.moveOnSuccess) {
      const closedStage = stages.find((s) => s.stage_type === pendingClose.outcome);
      if (closedStage) {
        const { lead } = pendingClose;
        setLeadsByStage((prev) => applyMove(prev, lead.id, lead.stage.id, closedStage));
      }
    }
  }

  // Called by the dialog both after a success and on cancel. A success sets
  // the flag first, so only a real cancel undoes the card's position.
  function handleCloseDialogDismiss() {
    if (closeSucceededRef.current) {
      closeSucceededRef.current = false;
    } else if (pendingClose) {
      setLeadsByStage(pendingClose.snapshot);
    }
    setPendingClose(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card-hover/60 text-caption text-text-muted flex items-center gap-2 rounded-md border px-3 py-2">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        Drag a card by its grip handle, or open the ⋮ menu to move it. Dropping on Won or Lost asks for the
        outcome first.
      </div>

      {openTruncated && (
        <div
          role="status"
          className="text-caption text-text-primary flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2"
        >
          <TriangleAlert className="size-3.5 shrink-0 text-amber-400" aria-hidden="true" />
          Showing the first {KANBAN_OPEN_LEAD_CAP} open leads. Use search or filters to narrow the pipeline,
          or switch to the Table view to browse everything.
        </div>
      )}

      <DndContext
        id="lead-kanban-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "To pick up a lead, press Space or Enter. Use the arrow keys to move it between stages, Space or Enter to drop it, and Escape to cancel. You can also use the actions menu on the lead to move it to any stage.",
          },
        }}
      >
        <LeadPipeline>
          {stages.map((stage) => {
            const loaded = leadsByStage[stage.id]?.length ?? 0;
            const total = displayCount(stage.id);

            return (
              <LeadStageColumn
                key={stage.id}
                stage={stage}
                count={total}
                footer={
                  total > loaded ? (
                    <p className="text-caption text-text-subtle px-1">
                      Showing the latest {loaded} of {total.toLocaleString()}. Use the Table view to browse
                      them all.
                    </p>
                  ) : null
                }
              >
                <DroppableColumnBody stageId={stage.id}>
                  <SortableContext
                    items={(leadsByStage[stage.id] ?? []).map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {(leadsByStage[stage.id] ?? []).map((lead) => (
                      <SortableLeadCard
                        key={lead.id}
                        lead={lead}
                        stages={stages}
                        onMoveToStage={handleMoveToStage}
                        onMarkWon={handleMarkWon}
                        onMarkLost={handleMarkLost}
                      />
                    ))}
                    {loaded === 0 && (
                      <p className="text-caption text-text-subtle px-1 py-6 text-center">No leads here</p>
                    )}
                  </SortableContext>
                </DroppableColumnBody>
              </LeadStageColumn>
            );
          })}
        </LeadPipeline>

        <DragOverlay dropAnimation={prefersReducedMotion ? null : undefined}>
          {activeLead ? (
            <LeadCard lead={activeLead} className="ring-primary/50 pl-8 shadow-lg ring-2" />
          ) : null}
        </DragOverlay>
      </DndContext>

      <MarkWonDialog
        isOpen={pendingClose?.outcome === "won"}
        onClose={handleCloseDialogDismiss}
        leadId={pendingClose?.lead.id ?? ""}
        onMarked={handleCloseSucceeded}
      />

      <MarkLostDialog
        isOpen={pendingClose?.outcome === "lost"}
        onClose={handleCloseDialogDismiss}
        leadId={pendingClose?.lead.id ?? ""}
        reasons={lostReasons}
        onMarked={handleCloseSucceeded}
      />
    </div>
  );
}

function DroppableColumnBody({ stageId, children }: { stageId: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: stageId });
  return (
    <div ref={setNodeRef} className="flex min-h-10 flex-col gap-2.5">
      {children}
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
  onMoveToStage: (lead: LeadSummary, stageId: string) => void;
  onMarkWon: (lead: LeadSummary) => void;
  onMarkLost: (lead: LeadSummary) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: lead.id,
    });

  // These keep the same identity from frame to frame during a drag (the lead
  // and the board's handlers don't change), which is what lets LeadCard skip
  // re-rendering.
  const handleMove = useCallback((stageId: string) => onMoveToStage(lead, stageId), [lead, onMoveToStage]);
  const handleWon = useCallback(() => onMarkWon(lead), [lead, onMarkWon]);
  const handleLost = useCallback(() => onMarkLost(lead), [lead, onMarkLost]);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: prefersReducedMotion ? undefined : transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag ${lead.lead_number} to another stage`}
        className="text-text-subtle hover:bg-card-hover hover:text-text-muted focus-visible:ring-primary absolute top-3 left-1.5 z-10 flex size-6 cursor-grab touch-none items-center justify-center rounded before:absolute before:-inset-1.5 before:content-[''] focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <LeadCard
        lead={lead}
        stages={stages}
        onMoveToStage={handleMove}
        onMarkWon={handleWon}
        onMarkLost={handleLost}
        className="pl-8"
      />
    </div>
  );
});
