import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import type { CustomerProfile } from "@/src/lib/types/customer";

interface CustomerContactCardProps {
  customer: CustomerProfile;
  locationName: string | null;
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="text-text-muted mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-caption">{label}</p>
        <p className="text-body-sm text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

export function CustomerContactCard({ customer, locationName }: CustomerContactCardProps) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <p className="text-label">Contact</p>
      <ContactRow icon={Mail} label="Email" value={customer.email} />
      <ContactRow icon={Phone} label="Phone" value={customer.phone} />
      {customer.alternative_phone && (
        <ContactRow icon={Phone} label="Alternative Phone" value={customer.alternative_phone} />
      )}
      <ContactRow icon={MapPin} label="Location" value={locationName} />
      <ContactRow icon={Globe} label="Preferred Language" value={customer.preferred_language} />
    </Card>
  );
}
