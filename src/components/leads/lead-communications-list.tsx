"use client";

import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { CommunicationItem } from "@/src/components/customers/communication-item";
import { LogLeadCommunicationDialog } from "@/src/components/leads/log-lead-communication-dialog";

import type { EnrichedLeadCommunication } from "@/src/lib/supabase/lead-communications-queries";
import type { CustomerCommunication } from "@/src/lib/types/customer";

interface LeadCommunicationsListProps {
  leadId: string;
  customerId: string;
  communications: EnrichedLeadCommunication[];
}

export function LeadCommunicationsList({ leadId, customerId, communications }: LeadCommunicationsListProps) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => setLogOpen(true)}>
          Log Communication
        </Button>
      </div>

      {communications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <MessageSquare className="text-text-subtle size-8" aria-hidden="true" />

          <div>
            <p className="text-body-lg text-text-primary">No communications logged yet</p>

            <p className="text-body-sm text-text-muted mt-1">
              Log a WhatsApp message, email, phone call, or internal note tied to this lead.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {communications.map((comm) => {
            const communication: CustomerCommunication = {
              ...comm,
              customer_id: customerId,
            };

            return (
              <CommunicationItem
                key={comm.id}
                communication={communication}
                staffName={comm.staffName}
                relatedVehicleTitle={comm.relatedVehicleTitle}
              />
            );
          })}
        </div>
      )}

      <LogLeadCommunicationDialog
        isOpen={logOpen}
        onClose={() => setLogOpen(false)}
        leadId={leadId}
        customerId={customerId}
      />
    </div>
  );
}
