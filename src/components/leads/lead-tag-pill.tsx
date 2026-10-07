import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import type { LeadTag } from "@/src/lib/types/lead";

interface LeadTagPillProps {
  tag: LeadTag;
  className?: string;
  /** Pass selected + onClick to make this a toggleable pill (e.g. in a form). Omit both for plain display (e.g. on LeadCard). */
  selected?: boolean;
  onClick?: () => void;
}

export function LeadTagPill({ tag, className, selected, onClick }: LeadTagPillProps) {
  const isInteractive = !!onClick;
  const isActive = isInteractive ? !!selected : true;

  const style = {
    "--omc-status-raw": tag.color_hex,
    backgroundColor: isActive ? `${tag.color_hex}1A` : "transparent",
    borderColor: isActive ? `${tag.color_hex}66` : "var(--omc-border)",
  } as React.CSSProperties;

  const textClass = isActive ? "text-[var(--omc-status-text)]" : "text-text-muted";

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "text-body-sm inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors",
          textClass,
          className,
        )}
        style={style}
      >
        {isActive && <Check className="size-3" aria-hidden="true" />}
        {tag.name}
      </button>
    );
  }

  return (
    <span
      className={cn(
        "text-caption inline-flex items-center rounded-full border px-2 py-0.5",
        textClass,
        className,
      )}
      style={style}
    >
      {tag.name}
    </span>
  );
}
