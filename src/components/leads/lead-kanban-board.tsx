"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
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
import { GripVertical, Info } from "lucide-react";
import { LeadPipeline } from "@/src/components/leads/lead-pipeline";
import { LeadStageColumn } from "@/src/components/leads/lead-stage-column";
import { LeadCard } from "@/src/components/leads/lead-card";
import { moveLeadStage } from "@/app/admin/leads/actions";
import { useReducedMotion } from "@/src/hooks/use-reduced-motion";
import type { LeadStage, LeadSummary } from "@/src/lib/types/lead";

interface LeadKanbanBoardProps {
  stages: LeadStage[];
  initialLeadsByStage: Record<string, LeadSummary[]>;
}

type LeadsByStage = Record<string, LeadSummary[]>;

function applyMove(prev: LeadsByStage, leadId: string, fromStageId: string, toStageId: string): LeadsByStage {
  const fromItems = prev[fromStageId] ?? [];
  const lead = fromItems.find((l) => l.id === leadId);
  if (!lead) return prev;

  return {
    ...prev,
    [fromStageId]: fromItems.filter((l) => l.id !== leadId),
    [toStageId]: [{ ...lead, stage: { ...lead.stage, id: toStageId } }, ...(prev[toStageId] ?? [])],
  };
}

export function LeadKanbanBoard({ stages, initialLeadsByStage }: LeadKanbanBoardProps) {
  const [leadsByStage, setLeadsByStage] = useState(initialLeadsByStage);
  const [activeLead, setActiveLead] = useState<LeadSummary | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const snapshotRef = useRef<LeadsByStage | null>(null);
  const startContainerRef = useRef<string | null>(null);
  const currentContainerRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    return stages.find((s) => s.id === container)?.name ?? "an unknown stage";
  }

  // dnd-kit's default announcements read out raw ids (UUIDs here). These
  // say what a person actually needs to hear.
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

  async function persist(leadId: string, toStageId: string, snapshot: LeadsByStage) {
    const result = await moveLeadStage(leadId, toStageId);
    if (result.error) {
      setLeadsByStage(snapshot);
      toast.error(result.error);
      return;
    }
    const newStage = stages.find((s) => s.id === toStageId);
    if (newStage) toast.success(`Lead moved to ${newStage.name}`);
  }

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

    setLeadsByStage((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((l) => l.id === activeId);
      if (activeIndex === -1) return prev;

      const moved = activeItems[activeIndex];
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

    // Dropped outside every column: undo the live preview instead of
    // quietly keeping a move that was never saved.
    if (!over) {
      setLeadsByStage(snapshot);
      return;
    }

    if (endContainer !== startContainer) {
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

  // Escape mid-drag: restore exactly what the board looked like before.
  function handleDragCancel() {
    if (snapshotRef.current) setLeadsByStage(snapshotRef.current);
    resetGesture();
  }

  function handleMoveToStage(lead: LeadSummary, toStageId: string) {
    if (toStageId === lead.stage.id) return;
    const snapshot = leadsByStage;
    setLeadsByStage((prev) => applyMove(prev, lead.id, lead.stage.id, toStageId));
    void persist(lead.id, toStageId, snapshot);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card-hover/60 text-caption text-text-muted flex items-center gap-2 rounded-md border px-3 py-2">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        Drag a card by its grip handle, or open the ⋮ menu on any card to move it. Both save automatically.
      </div>

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
          {stages.map((stage) => (
            <LeadStageColumn key={stage.id} stage={stage} count={leadsByStage[stage.id]?.length ?? 0}>
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
                      onMoveToStage={(toStageId) => handleMoveToStage(lead, toStageId)}
                    />
                  ))}
                  {(leadsByStage[stage.id]?.length ?? 0) === 0 && (
                    <p className="text-caption text-text-subtle px-1 py-6 text-center">No leads here</p>
                  )}
                </SortableContext>
              </DroppableColumnBody>
            </LeadStageColumn>
          ))}
        </LeadPipeline>

        {/* Renders the card being dragged above everything else, so it is
            never clipped by the scrolling column it started in. */}
        <DragOverlay dropAnimation={prefersReducedMotion ? null : undefined}>
          {activeLead ? <LeadCard lead={activeLead} className="ring-primary/50 shadow-lg ring-2" /> : null}
        </DragOverlay>
      </DndContext>
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

function SortableLeadCard({
  lead,
  stages,
  onMoveToStage,
}: {
  lead: LeadSummary;
  stages: LeadStage[];
  onMoveToStage: (stageId: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
      id: lead.id,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: prefersReducedMotion ? undefined : transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LeadCard
        lead={lead}
        stages={stages}
        onMoveToStage={onMoveToStage}
        dragHandle={
          // Only this handle starts a drag. The rest of the card scrolls and
          // behaves normally on touch, and its link and menu keep their own
          // Enter/Space behavior instead of being hijacked by the drag.
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Drag ${lead.lead_number} to another stage`}
            className="text-text-subtle hover:bg-card-hover hover:text-text-muted focus-visible:ring-primary relative mt-0.5 flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded before:absolute before:-inset-1.5 before:content-[''] focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
