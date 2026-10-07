"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
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
import { Info } from "lucide-react";
import { LeadPipeline } from "@/src/components/leads/lead-pipeline";
import { LeadStageColumn } from "@/src/components/leads/lead-stage-column";
import { LeadCard } from "@/src/components/leads/lead-card";
import { moveLeadStage } from "@/app/admin/leads/actions";
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

  // Drag-gesture bookkeeping that lives outside React state — refs, since
  // none of this should trigger a re-render on its own, only via setState.
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

  async function persist(leadId: string, fromStageId: string, toStageId: string, snapshot: LeadsByStage) {
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
    setActiveLead(null);

    const activeId = String(active.id);
    const startContainer = startContainerRef.current;
    const endContainer = currentContainerRef.current;
    const snapshot = snapshotRef.current;

    snapshotRef.current = null;
    startContainerRef.current = null;
    currentContainerRef.current = null;

    if (!startContainer || !endContainer || !snapshot) return;

    if (endContainer !== startContainer) {
      // Already moved visually during handleDragOver — just persist it.
      void persist(activeId, startContainer, endContainer, snapshot);
      return;
    }

    // Same column: a plain reorder, not a stage change — purely visual,
    // nothing to persist (no per-stage ordering column exists in this
    // schema, by design).
    if (!over) return;
    const overId = String(over.id);
    setLeadsByStage((prev) => {
      const items = prev[startContainer];
      const oldIndex = items.findIndex((l) => l.id === activeId);
      const newIndex = items.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
      return { ...prev, [startContainer]: arrayMove(items, oldIndex, newIndex) };
    });
  }

  function handleMoveToStage(lead: LeadSummary, toStageId: string) {
    if (toStageId === lead.stage.id) return;
    const snapshot = leadsByStage;
    setLeadsByStage((prev) => applyMove(prev, lead.id, lead.stage.id, toStageId));
    void persist(lead.id, lead.stage.id, toStageId, snapshot);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-card-hover/60 text-caption text-text-muted flex items-center gap-2 rounded-md border px-3 py-2">
        <Info className="size-3.5 shrink-0" aria-hidden="true" />
        Drag a card to change its stage, or use the ⋮ menu on any card — both are saved automatically.
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <LeadCard lead={lead} stages={stages} onMoveToStage={onMoveToStage} />
    </div>
  );
}
