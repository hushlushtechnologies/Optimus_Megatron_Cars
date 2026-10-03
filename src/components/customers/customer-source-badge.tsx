import { Badge } from "@/src/components/ui/badge";

interface CustomerSourceBadgeProps {
  sourceName: string | null;
  sourceDetail?: string | null;
}

export function CustomerSourceBadge({ sourceName, sourceDetail }: CustomerSourceBadgeProps) {
  if (!sourceName) return <span className="text-body-sm text-text-subtle">—</span>;

  const label = sourceName === "Other" && sourceDetail ? sourceDetail : sourceName;

  return <Badge status="neutral">{label}</Badge>;
}
