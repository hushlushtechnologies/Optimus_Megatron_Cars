import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface Tag {
  id: string;
  name: string;
  color_hex: string;
}

interface CustomerTagPillProps {
  tag: Tag;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function CustomerTagPill({ tag, selected, onClick, onRemove, className }: CustomerTagPillProps) {
  const isInteractive = !!onClick;
  const isActive = selected ?? true;

  const style = {
    "--omc-status-raw": tag.color_hex,
    backgroundColor: isActive ? `${tag.color_hex}1A` : "transparent",
    borderColor: isActive ? `${tag.color_hex}66` : "var(--omc-border)",
  } as React.CSSProperties;

  const textClass = isActive ? "text-[var(--omc-status-text)]" : "text-text-muted";

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
          textClass,
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
        textClass,
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
          className="relative -mr-1 ml-0.5 flex size-4 items-center justify-center opacity-70 before:absolute before:-inset-2.5 before:content-[''] hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}
