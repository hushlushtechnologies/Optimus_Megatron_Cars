import { cn } from "@/src/lib/utils/cn";

interface CustomerAvatarProps {
  fullName: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-8 text-caption",
  md: "size-10 text-body-sm",
  lg: "size-16 text-h3",
} as const;

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function CustomerAvatar({ fullName, photoUrl, size = "md", className }: CustomerAvatarProps) {
  return (
    <div
      className={cn(
        "bg-primary/15 text-primary flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        sizeMap[size],
        className,
      )}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{getInitials(fullName)}</span>
      )}
    </div>
  );
}
