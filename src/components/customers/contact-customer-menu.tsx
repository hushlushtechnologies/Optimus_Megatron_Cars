"use client";

import { Mail, Phone, MessageCircle, ChevronDown } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";

interface ContactCustomerMenuProps {
  email: string;
  phone: string;
}

export function ContactCustomerMenu({ email, phone }: ContactCustomerMenuProps) {
  const whatsappNumber = phone.replace(/\D/g, "");

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="outline" leftIcon={<Phone className="size-4" />} rightIcon={<ChevronDown className="size-3.5" />}>
          Contact Customer
        </Button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-52 py-1">
        <a href={`mailto:${email}`} role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-text-primary hover:bg-card-hover">
          <Mail className="size-4 text-text-muted" aria-hidden="true" />
          Email
        </a>
        <a href={`tel:${phone}`} role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-text-primary hover:bg-card-hover">
          <Phone className="size-4 text-text-muted" aria-hidden="true" />
          Call
        </a>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noreferrer"
          role="menuitem"
          className="flex items-center gap-2.5 px-4 py-2 text-body-sm text-text-primary hover:bg-card-hover"
        >
          <MessageCircle className="size-4 text-text-muted" aria-hidden="true" />
          WhatsApp
        </a>
      </DropdownContent>
    </Dropdown>
  );
}