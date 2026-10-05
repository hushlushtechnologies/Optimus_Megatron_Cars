"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/shared/empty-state";
import { CommunicationItem } from "@/src/components/customers/communication-item";
import { LogCommunicationDialog } from "@/src/components/customers/log-communication-dialog";
import type { EnrichedCommunication } from "@/src/lib/supabase/customer-communications-queries";

interface CommunicationsListProps {
  customerId: string;
  communications: EnrichedCommunication[];
}

export function CommunicationsList({ customerId, communications }: CommunicationsListProps) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setLogOpen(true)}>
          Log Communication
        </Button>
      </div>

      {communications.length === 0 ? (
        <EmptyState
          title="No communications logged yet"
          description="Log a WhatsApp message, email, phone call, or internal note to keep a record of this customer's conversations."
          action={{ label: "Log Communication", onClick: () => setLogOpen(true) }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {communications.map((comm) => (
            <CommunicationItem
              key={comm.id}
              communication={comm}
              staffName={comm.staffName}
              relatedVehicleTitle={comm.relatedVehicleTitle}
            />
          ))}
        </div>
      )}

      <LogCommunicationDialog isOpen={logOpen} onClose={() => setLogOpen(false)} customerId={customerId} />
    </div>
  );
}
