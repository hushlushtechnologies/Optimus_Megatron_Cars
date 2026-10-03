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
      <div className="flex flex-wrap items-center gap-2">{children}</div>

      {(activeFilters.length > 0 || resultCount !== undefined) && (
        <div className="flex flex-wrap items-center gap-2">
          {resultCount !== undefined && (
            <span className="text-body-sm text-text-muted">{resultCount} results</span>
          )}
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="border-border bg-card-hover text-body-sm text-text-primary inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            >
              {filter.label}
              {onRemoveFilter && (
                <button
                  type="button"
                  aria-label={`Remove filter: ${filter.label}`}
                  onClick={() => onRemoveFilter(filter.key)}
                  className="text-text-muted hover:text-text-primary"
                >
                  <X className="size-3" />
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
