import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface Tag {
  id: string;
  name: string;
  color_hex: string;
}

interface CustomerTagPillProps {
  tag: Tag;
  /** Toggleable pill (filter drawer, form tag picker) vs. plain display (header, table) */
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function CustomerTagPill({ tag, selected, onClick, onRemove, className }: CustomerTagPillProps) {
  const isInteractive = !!onClick;
  const isActive = selected ?? true; // plain-display pills are always "active" styling

  const style = {
    backgroundColor: isActive ? `${tag.color_hex}1A` : "transparent",
    borderColor: isActive ? `${tag.color_hex}66` : "var(--omc-border)",
    color: isActive ? tag.color_hex : "var(--omc-text-muted)",
  };

  const content = (
    <>
      {isInteractive && isActive && <Check className="size-3" aria-hidden="true" />}
      {tag.name}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
          className,
        )}
        style={style}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={cn(
        "text-body-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        className,
      )}
      style={style}
    >
      {content}
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          onClick={onRemove}
          className="ml-0.5 opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
