"use client";

import { useRouter } from "next/navigation";
import {
  Inbox,
  Search,
  SearchX,
  FileQuestion,
  CarFront,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Illustration } from "@/src/components/shared/illustration";
import { Button } from "@/src/components/ui/button";

export type EmptyStateIcon =
  | "Inbox"
  | "Search"
  | "FileQuestion"
  | "SearchX"
  | "CarFront"
  | "Users";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: EmptyStateIcon;
  lottieSrc?: string;

  action?: {
    label: string;
    href: string;
  };
}

const iconMap: Record<EmptyStateIcon, LucideIcon> = {
  Inbox,
  Search,
  SearchX,
  FileQuestion,
  CarFront,
  Users,
};

export function EmptyState({
  title,
  description,
  icon = "Inbox",
  lottieSrc = "/lottie/empty.json",
  action,
}: EmptyStateProps) {
  const router = useRouter();

  const Icon = iconMap[icon];

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <Illustration lottieSrc={lottieSrc} fallbackIcon={Icon} />

      <div className="max-w-sm">
        <h3 className="text-h3">{title}</h3>

        {description && (
          <p className="mt-1 text-body-sm text-text-muted">{description}</p>
        )}
      </div>

      {action && (
        <Button variant="secondary" onClick={() => router.push(action.href)}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
