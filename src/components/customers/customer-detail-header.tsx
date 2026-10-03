"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, StickyNote, Tag, MoreVertical, MapPin, Mail, Phone } from "lucide-react";
import { CustomerAvatar } from "@/src/components/customers/customer-avatar";
import {
  CustomerLifecycleBadge,
  CustomerAccountStatusBadge,
} from "@/src/components/customers/customer-status-badge";
import { CustomerSourceBadge } from "@/src/components/customers/customer-source-badge";
import { CustomerTagPill } from "@/src/components/customers/customer-tag-pill";
import { ContactCustomerMenu } from "@/src/components/customers/contact-customer-menu";
import { AddNoteDialog } from "@/src/components/customers/add-note-dialog";
import { ManageTagsDialog } from "@/src/components/customers/manage-tags-dialog";
import { Button } from "@/src/components/ui/button";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { IconButton } from "@/src/components/ui/icon-button";
import type { CustomerDetail } from "@/src/lib/supabase/customer-detail-queries";
import type { CustomerTag } from "@/src/lib/supabase/customer-lookups";

interface CustomerDetailHeaderProps {
  customer: CustomerDetail;
  assignedTags: CustomerTag[];
  availableTags: CustomerTag[];
}

export function CustomerDetailHeader({ customer, assignedTags, availableTags }: CustomerDetailHeaderProps) {
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <CustomerAvatar fullName={customer.full_name} photoUrl={customer.profile_photo_url} size="lg" />
          <div className="min-w-0">
            <h1 className="text-h2">{customer.full_name}</h1>
            <p className="text-body-sm text-text-muted">{customer.customer_number}</p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <CustomerLifecycleBadge status={customer.lifecycle_status} />
              <CustomerAccountStatusBadge status={customer.account_status} />
              <CustomerSourceBadge
                sourceName={customer.source?.name ?? null}
                sourceDetail={customer.source_detail}
              />
              {assignedTags.map((tag) => (
                <CustomerTagPill key={tag.id} tag={tag} />
              ))}
            </div>

            <div className="text-caption text-text-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden="true" />
                {customer.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" aria-hidden="true" />
                {customer.phone}
              </span>
              {customer.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {customer.location.name}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button leftIcon={<Pencil className="size-4" />}>Edit Customer</Button>
          </Link>
          <Button
            variant="outline"
            leftIcon={<StickyNote className="size-4" />}
            onClick={() => setAddNoteOpen(true)}
          >
            Add Note
          </Button>
          <ContactCustomerMenu email={customer.email} phone={customer.phone} />
          <Button
            variant="outline"
            leftIcon={<Tag className="size-4" />}
            onClick={() => setManageTagsOpen(true)}
          >
            Manage Tags
          </Button>

          <Dropdown>
            <DropdownTrigger>
              <IconButton aria-label="More actions" variant="outline">
                <MoreVertical className="size-4" />
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="end" className="w-48 py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => toast.info("Export arrives in Sprint 3 Phase 17")}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center px-4 py-2 text-left"
              >
                Export
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => toast.info("Archive arrives in Sprint 3 Phase 16")}
                className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center px-4 py-2 text-left"
              >
                Archive
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => toast.info("Delete arrives in Sprint 3 Phase 16")}
                className="text-body-sm hover:bg-card-hover flex w-full items-center px-4 py-2 text-left text-red-400"
              >
                Delete
              </button>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      <AddNoteDialog isOpen={addNoteOpen} onClose={() => setAddNoteOpen(false)} customerId={customer.id} />
      <ManageTagsDialog
        isOpen={manageTagsOpen}
        onClose={() => setManageTagsOpen(false)}
        customerId={customer.id}
        assignedTags={assignedTags}
        availableTags={availableTags}
      />
    </div>
  );
}
