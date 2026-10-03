import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Mail, Phone, StickyNote, type LucideIcon } from "lucide-react";
import type { CustomerCommunication } from "@/src/lib/types/customer";

interface CommunicationItemProps {
  communication: CustomerCommunication;
  staffName: string;
  relatedVehicleTitle?: string | null;
}

const TYPE_ICON: Record<CustomerCommunication["type"], LucideIcon> = {
  WhatsApp: MessageCircle,
  Email: Mail,
  "Phone Call": Phone,
  "Internal Note": StickyNote,
};

export function CommunicationItem({ communication, staffName, relatedVehicleTitle }: CommunicationItemProps) {
  const Icon = TYPE_ICON[communication.type];

  return (
    <div className="surface-card flex items-start gap-3 p-3">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-body-sm text-text-primary font-medium">
            {communication.subject || communication.type}
          </p>
          <p className="text-caption text-text-subtle">
            {formatDistanceToNow(new Date(communication.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <p className="text-body-sm text-text-muted mt-0.5">{communication.summary}</p>
        <p className="text-caption mt-1">
          {staffName}
          {relatedVehicleTitle && ` · Re: ${relatedVehicleTitle}`}
        </p>
      </div>
    </div>
  );
}
