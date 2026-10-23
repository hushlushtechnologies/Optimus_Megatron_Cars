import { X } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface FilterChip {
  key: string;
  label: string;
}

interface FilterBarProps {
  children: React.ReactNode;
  activeFilters?: FilterChip[];
  onRemoveFilter?: (key: string) => void;
  onClearAll?: () => void;
  resultCount?: number;
}

export function FilterBar({
  children,
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}

      {(activeFilters.length > 0 || resultCount !== undefined) && (
        <div role="group" aria-label="Active filters" className="flex flex-wrap items-center gap-2">
          {resultCount !== undefined && (
            <span className="text-body-sm text-text-muted">{resultCount} results</span>
          )}
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="border-border bg-card-hover text-body-sm text-text-primary inline-flex items-center gap-1 rounded-full border py-0.5 pr-0.5 pl-3"
            >
              {filter.label}
              {onRemoveFilter && (
                <button
                  type="button"
                  aria-label={`Remove filter: ${filter.label}`}
                  onClick={() => onRemoveFilter(filter.key)}
                  className="text-text-muted hover:text-text-primary hover:bg-card inline-flex size-7 items-center justify-center rounded-full transition-colors"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
          {activeFilters.length > 0 && onClearAll && (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
