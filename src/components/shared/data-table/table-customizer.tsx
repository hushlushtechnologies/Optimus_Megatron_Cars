"use client";

import { Check, Columns3, RotateCcw, SlidersHorizontal } from "lucide-react";

import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";

import { IconButton } from "@/src/components/ui/icon-button";

import { cn } from "@/src/lib/utils/cn";

/* =========================================================
   TYPES
========================================================= */

interface ColumnOption {
  id: string;
  label: string;
}

interface TableCustomizerProps {
  columns: ColumnOption[];

  visibility: Record<string, boolean>;

  onVisibilityChange: (columnId: string, visible: boolean) => void;

  onReset: () => void;
}

/* =========================================================
   TABLE CUSTOMIZER
========================================================= */

export function TableCustomizer({ columns, visibility, onVisibilityChange, onReset }: TableCustomizerProps) {
  const visibleCount = columns.filter((column) => visibility[column.id] ?? true).length;

  return (
    <Dropdown>
      {/* ===================================================
          TRIGGER
      =================================================== */}

      <DropdownTrigger>
        <IconButton aria-label="Customize columns" variant="outline" size="sm" className="size-10 rounded-lg">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
        </IconButton>
      </DropdownTrigger>

      {/* ===================================================
          DROPDOWN
      =================================================== */}

      <DropdownContent
        align="end"
        className="border-border bg-card shadow-soft-lg z-[9999] w-64 overflow-hidden rounded-xl border p-1.5"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-start gap-3 px-2.5 pt-1.5 pb-2">
          <span className="bg-primary/[0.08] text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
            <Columns3 className="size-3.5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-text-muted text-[10px] font-semibold tracking-[0.08em] uppercase">
                Table columns
              </p>

              <span className="bg-primary/[0.08] text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
                {visibleCount}/{columns.length}
              </span>
            </div>

            <p className="text-text-subtle mt-0.5 text-[9px] leading-4">
              Choose which fields appear in the table
            </p>
          </div>
        </div>

        <MenuDivider />

        {/* =================================================
            SECTION LABEL
        ================================================= */}

        <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
          <p className="text-text-subtle text-[9px] font-semibold tracking-[0.08em] uppercase">
            Visible columns
          </p>

          <button
            type="button"
            onClick={onReset}
            className="group/reset text-text-subtle hover:bg-card-hover hover:text-primary flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-medium transition-colors duration-150"
          >
            <RotateCcw
              className="size-3 transition-transform duration-300 group-hover/reset:-rotate-45"
              aria-hidden="true"
            />
            Reset
          </button>
        </div>

        {/* =================================================
            COLUMN LIST
        ================================================= */}

        <ul className="scrollbar-hidden max-h-72 overflow-y-auto py-0.5">
          {columns.map((column) => {
            const isVisible = visibility[column.id] ?? true;

            return (
              <li key={column.id}>
                <label
                  className={cn(
                    `group/column hover:bg-card-hover flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors duration-150`,

                    isVisible && "bg-primary/[0.025]",
                  )}
                >
                  {/* =======================================
                      CUSTOM CHECKBOX
                  ======================================= */}

                  <span
                    className={cn(
                      `relative flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-150`,

                      isVisible
                        ? `border-primary/50 bg-primary text-[#0b1220]`
                        : `border-border bg-surface group-hover/column:border-text-subtle/50`,
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(event) => onVisibilityChange(column.id, event.target.checked)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />

                    {isVisible && <Check className="size-3" strokeWidth={2.5} aria-hidden="true" />}
                  </span>

                  {/* =======================================
                      LABEL
                  ======================================= */}

                  <span
                    className={cn(
                      `min-w-0 flex-1 truncate text-[11px] font-medium transition-colors duration-150`,

                      isVisible
                        ? "text-text-primary"
                        : `text-text-muted group-hover/column:text-text-primary`,
                    )}
                  >
                    {column.label}
                  </span>

                  {/* =======================================
                      STATUS
                  ======================================= */}

                  <span
                    className={cn(
                      `shrink-0 text-[8px] font-medium tracking-[0.06em] uppercase transition-colors`,

                      isVisible ? "text-primary" : "text-text-subtle",
                    )}
                  >
                    {isVisible ? "Shown" : "Hidden"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {/* =================================================
            FOOTER
        ================================================= */}

        <MenuDivider />

        <div className="flex items-center gap-2 px-2.5 py-2">
          <span
            aria-hidden="true"
            className="bg-success size-1.5 shrink-0 rounded-full shadow-[0_0_7px_rgba(50,183,105,0.35)]"
          />

          <p className="text-text-subtle text-[9px] leading-4">Changes are saved automatically</p>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

/* =========================================================
   DIVIDER
========================================================= */

function MenuDivider() {
  return <div aria-hidden="true" className="bg-border/70 my-1 h-px" />;
}
