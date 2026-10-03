"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, ShieldOff, KeyRound, Mail, Clock } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import { CustomerAccountStatusBadge } from "@/src/components/customers/customer-status-badge";
import {
  activateAccount,
  disableAccount,
  sendPasswordReset,
  sendAccountSetupEmail,
} from "@/app/admin/customers/[id]/actions";
import type { CustomerProfile } from "@/src/lib/types/customer";
import type { CustomerAuthStatus } from "@/src/lib/supabase/customer-detail-queries";

interface AccountManagementCardProps {
  customer: Pick<CustomerProfile, "id" | "email" | "account_status" | "user_id" | "created_at">;
  authStatus: CustomerAuthStatus | null;
}

export function AccountManagementCard({ customer, authStatus }: AccountManagementCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  const run = async (action: () => Promise<{ error: string | null }>, successMessage: string) => {
    setIsPending(true);
    const result = await action();
    setIsPending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
  };

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-label">Account</p>
        <CustomerAccountStatusBadge status={customer.account_status} />
      </div>

      <div className="text-body-sm text-text-muted flex flex-col gap-2">
        <p className="flex items-center gap-2">
          <Clock className="size-3.5" aria-hidden="true" />
          Joined{" "}
          {formatDistanceToNow(new Date(customer.created_at), {
            addSuffix: true,
          })}
        </p>
        {customer.user_id && (
          <p className="flex items-center gap-2">
            <Clock className="size-3.5" aria-hidden="true" />
            Last login:{" "}
            {authStatus?.lastSignInAt
              ? formatDistanceToNow(new Date(authStatus.lastSignInAt), {
                  addSuffix: true,
                })
              : "Never signed in"}
          </p>
        )}
      </div>

      <div className="border-border flex flex-wrap gap-2 border-t pt-4">
        {customer.account_status === "No Account" && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Mail className="size-3.5" />}
            isLoading={isPending}
            onClick={() =>
              run(() => sendAccountSetupEmail(customer.id, customer.email), "Account setup email sent")
            }
          >
            Send Account Setup Email
          </Button>
        )}

        {(customer.account_status === "Pending Setup" || customer.account_status === "Active") && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<KeyRound className="size-3.5" />}
            isLoading={isPending}
            onClick={() =>
              run(() => sendPasswordReset(customer.id, customer.email), "Password reset email sent")
            }
          >
            Send Password Reset
          </Button>
        )}

        {customer.account_status === "Disabled" && customer.user_id && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ShieldCheck className="size-3.5" />}
            isLoading={isPending}
            onClick={() => run(() => activateAccount(customer.id, customer.user_id!), "Account activated")}
          >
            Activate Account
          </Button>
        )}

        {(customer.account_status === "Active" || customer.account_status === "Pending Setup") &&
          customer.user_id && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldOff className="size-3.5" />}
              onClick={() => setConfirmDisableOpen(true)}
            >
              Disable Account
            </Button>
          )}
      </div>

      <ConfirmDialog
        isOpen={confirmDisableOpen}
        onClose={() => setConfirmDisableOpen(false)}
        onConfirm={() => {
          setConfirmDisableOpen(false);
          run(() => disableAccount(customer.id, customer.user_id!), "Account disabled");
        }}
        title="Disable this account?"
        description="The customer will be immediately signed out and unable to log in until reactivated."
        confirmLabel="Disable"
        variant="danger"
      />
    </Card>
  );
}
