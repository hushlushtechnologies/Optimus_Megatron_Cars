"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type VisibilityState,
  type ColumnOrderState,
  type Header,
} from "@tanstack/react-table";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { ArrowUp, ArrowDown, ArrowUpDown, GripVertical } from "lucide-react";

import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   TYPES
========================================================= */

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];

  isLoading?: boolean;

  emptyState?: ReactNode;

  getRowId?: (row: TData) => string;

  enableRowSelection?: boolean;

  rowSelection?: RowSelectionState;

  onRowSelectionChange?: (selection: RowSelectionState) => void;

  sorting?: SortingState;

  onSortingChange?: (sorting: SortingState) => void;

  columnVisibility?: VisibilityState;

  onColumnVisibilityChange?: (visibility: VisibilityState) => void;

  columnOrder?: ColumnOrderState;

  onColumnOrderChange?: (order: ColumnOrderState) => void;

  enableColumnResizing?: boolean;
}

/* =========================================================
   DATA TABLE
========================================================= */

export function DataTable<TData>(props: DataTableProps<TData>) {
  /*
   * HYDRATION FIX
   *
   * dnd-kit generates runtime accessibility IDs.
   * Your column preferences can also be different between
   * the server render and the first browser render.
   *
   * Because of that, we mount the existing interactive
   * table only after React hydration has completed.
   *
   * UI is unchanged.
   */

  return <DataTableContent {...props} />;
}

/* =========================================================
   TABLE CONTENT
========================================================= */

function DataTableContent<TData>({
  columns,
  data,
  isLoading,
  emptyState,
  getRowId,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  enableColumnResizing = false,
}: DataTableProps<TData>) {
  /* =======================================================
     DND
  ======================================================= */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),

    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /* =======================================================
     TABLE
  ======================================================= */

  const table = useReactTable({
    data,
    columns,

    getCoreRowModel: getCoreRowModel(),

    getSortedRowModel: getSortedRowModel(),

    getRowId,

    enableRowSelection,

    columnResizeMode: "onChange",

    enableColumnResizing,

    state: {
      ...(rowSelection !== undefined
        ? {
            rowSelection,
          }
        : {}),

      ...(sorting !== undefined
        ? {
            sorting,
          }
        : {}),

      ...(columnVisibility !== undefined
        ? {
            columnVisibility,
          }
        : {}),

      ...(columnOrder !== undefined
        ? {
            columnOrder,
          }
        : {}),
    },

    /* =====================================================
       ROW SELECTION
    ===================================================== */

    onRowSelectionChange: onRowSelectionChange
      ? (updater) => {
          const next = typeof updater === "function" ? updater(rowSelection ?? {}) : updater;

          onRowSelectionChange(next);
        }
      : undefined,

    /* =====================================================
       SORTING
    ===================================================== */

    onSortingChange: onSortingChange
      ? (updater) => {
          const next = typeof updater === "function" ? updater(sorting ?? []) : updater;

          onSortingChange(next);
        }
      : undefined,

    /* =====================================================
       COLUMN VISIBILITY
    ===================================================== */

    onColumnVisibilityChange: onColumnVisibilityChange
      ? (updater) => {
          const next = typeof updater === "function" ? updater(columnVisibility ?? {}) : updater;

          onColumnVisibilityChange(next);
        }
      : undefined,

    /* =====================================================
       COLUMN ORDER
    ===================================================== */

    onColumnOrderChange: onColumnOrderChange
      ? (updater) => {
          const next = typeof updater === "function" ? updater(columnOrder ?? []) : updater;

          onColumnOrderChange(next);
        }
      : undefined,
  });

  /* =======================================================
     DRAGGABLE IDS
  ======================================================= */

  const draggableIds = useMemo(
    () => table.getVisibleLeafColumns().map((column) => column.id),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, columnOrder, columnVisibility],
  );

  /* =======================================================
     DRAG END
  ======================================================= */

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id || !onColumnOrderChange) {
      return;
    }

    const currentOrder =
      columnOrder && columnOrder.length > 0
        ? columnOrder
        : table.getAllLeafColumns().map((column) => column.id);

    const oldIndex = currentOrder.indexOf(String(active.id));

    const newIndex = currentOrder.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const next = [...currentOrder];

    next.splice(oldIndex, 1);

    next.splice(newIndex, 0, String(active.id));

    onColumnOrderChange(next);
  }

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (!isLoading && data.length === 0) {
    return <>{emptyState}</>;
  }

  const headerRow = table.getHeaderGroups()[0];

  /* =======================================================
     UI
     EXACT SAME UI AS YOUR CURRENT COMPONENT
  ======================================================= */

  return (
    <div className="surface-card overflow-hidden">
      <div className="scrollbar-hidden overflow-x-auto overscroll-x-contain">
        {/*
          IMPORTANT:

          DndContext stays around the whole table.

          Do not move this inside <thead> or <tr>.
        */}

        <DndContext
          id="inventory-data-table-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table
            className="border-collapse text-left"
            style={{
              width: table.getTotalSize(),
            }}
          >
            {/* ============================================
                TABLE HEADER
            ============================================ */}

            <thead className="bg-card sticky top-0 z-10">
              <SortableContext items={draggableIds} strategy={horizontalListSortingStrategy}>
                <tr className="border-border border-b">
                  {headerRow?.headers.map((header) => (
                    <DraggableHeader
                      key={header.id}
                      header={header}
                      draggable={
                        !!onColumnOrderChange &&
                        header.column.id !== "select" &&
                        header.column.id !== "actions"
                      }
                      enableColumnResizing={enableColumnResizing}
                    />
                  ))}
                </tr>
              </SortableContext>
            </thead>

            {/* ============================================
                TABLE BODY
            ============================================ */}

            <tbody>
              {isLoading
                ? Array.from({
                    length: 6,
                  }).map((_, i) => (
                    <tr key={i} className="border-border border-b last:border-0">
                      {columns.map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-32" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className={cn(
                        `border-border hover:bg-card-hover border-b transition-colors last:border-0`,

                        row.getIsSelected() && "bg-primary/5",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                          }}
                          className="text-body-sm text-text-primary px-4 py-3"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,

                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
}

/* =========================================================
   DRAGGABLE HEADER
========================================================= */

function DraggableHeader<TData>({
  header,
  draggable,
  enableColumnResizing,
}: {
  header: Header<TData, unknown>;

  draggable: boolean;

  enableColumnResizing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,

    disabled: !draggable,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),

    transition,

    width: header.getSize(),

    opacity: isDragging ? 0.6 : 1,

    position: "relative",
  };

  const canSort = header.column.getCanSort();

  const sortDir = header.column.getIsSorted();

  /* =======================================================
     HEADER LABEL FOR ACCESSIBILITY
  ======================================================= */

  const headerValue = header.column.columnDef.header;

  const headerLabel =
    typeof headerValue === "string"
      ? headerValue
      : header.column.id === "select" || header.column.id === "actions" || header.column.id === "image"
        ? ""
        : header.column.id.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <th ref={setNodeRef} style={style} scope="col" className="text-label px-4 py-3 whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        {/* ================================================
            DRAG HANDLE
        ================================================ */}

        {draggable && (
          <button
            type="button"
            aria-label={
              headerLabel
                ? `Reorder ${headerLabel} column. Press Space to pick up, then use Arrow keys to move, then Space again to drop.`
                : "Reorder column. Press Space to pick up, then use Arrow keys to move, then Space again to drop."
            }
            title="Drag to reorder, or press Space then use arrow keys"
            {...attributes}
            {...listeners}
            className="text-text-subtle hover:text-text-muted cursor-grab touch-none active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" aria-hidden="true" />
          </button>
        )}

        {/* ================================================
            SORTABLE HEADER
        ================================================ */}

        {header.isPlaceholder ? null : canSort ? (
          <button
            type="button"
            onClick={header.column.getToggleSortingHandler()}
            className="text-label hover:text-text-primary flex items-center gap-1"
          >
            {flexRender(
              header.column.columnDef.header,

              header.getContext(),
            )}

            {sortDir === "asc" ? (
              <ArrowUp className="size-3" aria-hidden="true" />
            ) : sortDir === "desc" ? (
              <ArrowDown className="size-3" aria-hidden="true" />
            ) : (
              <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
            )}
          </button>
        ) : (
          flexRender(
            header.column.columnDef.header,

            header.getContext(),
          )
        )}
      </div>

      {/* ================================================
          COLUMN RESIZE HANDLE
      ================================================ */}

      {enableColumnResizing && header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            `hover:bg-primary/40 absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none`,

            header.column.getIsResizing() && "bg-primary",
          )}
        />
      )}
    </th>
  );
}

/* =========================================================
   SELECTION COLUMN
========================================================= */

export function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",

    size: 40,

    enableResizing: false,

    header: ({ table }) => (
      <label className="relative inline-flex size-4 cursor-pointer items-center justify-center before:absolute before:-inset-2.5 before:content-['']">
        <input
          type="checkbox"
          aria-label="Select all rows"
          checked={table.getIsAllRowsSelected()}
          ref={(el) => {
            if (el) {
              el.indeterminate = table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected();
            }
          }}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="border-border accent-primary size-4 rounded"
        />
      </label>
    ),

    cell: ({ row }) => (
      <label className="relative inline-flex size-4 cursor-pointer items-center justify-center before:absolute before:-inset-2.5 before:content-['']">
        <input
          type="checkbox"
          aria-label="Select row"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="border-border accent-primary size-4 rounded"
        />
      </label>
    ),
  };
}
