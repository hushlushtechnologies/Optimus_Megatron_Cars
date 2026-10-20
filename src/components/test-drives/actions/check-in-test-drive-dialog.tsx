"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle2, LogIn, Phone, XCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { TestDriveActionSummary } from "@/src/components/test-drives/actions/test-drive-action-summary";
import { checkInTestDriveAction, getCheckInDataAction } from "@/app/admin/test-drives/check-in-actions";
import { describeCheckInWindow } from "@/src/lib/utils/test-drive-check-in";
import { formatDayLong, formatTime, formatTimeRange } from "@/src/lib/utils/test-drive-format";
import type { TestDriveActionSubject, TestDriveCheckInData } from "@/src/lib/types/test-drive";

interface CheckInTestDriveDialogProps {
  subject: TestDriveActionSubject;
  onClose: () => void;
  /** Called after a successful check-in. */
  onDone: () => void;
}

const CONFIRMED = ["Approved", "Rescheduled"];

function CheckRow({ ok, label, children }: { ok: boolean; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
      )}
      <div className="min-w-0">
        <p className="text-caption text-text-subtle">
          {label}
          <span className="sr-only">{ok ? " (ok)" : " (needs attention)"}</span>
        </p>
        <p className="text-body-sm text-text-primary">{children}</p>
      </div>
    </li>
  );
}

// The parent only renders this while it's open, so every opening loads fresh data and starts clean.
export function CheckInTestDriveDialog({ subject, onClose, onDone }: CheckInTestDriveDialogProps) {
  const [data, setData] = useState<TestDriveCheckInData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [verified, setVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCheckInDataAction({ id: subject.id })
      .then((result) => {
        if (cancelled) return;
        if (!result) setLoadFailed(true);
        else setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [subject.id]);

  const statusOk = !!data && CONFIRMED.includes(data.status) && !data.archived;
  const alreadyIn = !!data?.checkedInAt;
  const windowInfo = data ? describeCheckInWindow(data.window) : null;
  const windowOpen = data?.window.state === "open";
  const canCheckIn = !!data && statusOk && !alreadyIn && windowOpen && verified && !isSaving;

  let hint: string | null = null;
  if (data && !alreadyIn) {
    if (!statusOk) hint = `This test drive is ${data.status.toLowerCase()}, so it can't be checked in.`;
    else if (!windowOpen) hint = windowInfo?.text ?? null;
    else if (!verified) hint = "Confirm you've verified the customer to continue.";
  }

  const handleCheckIn = async () => {
    if (!data) return;

    setError(null);
    setIsSaving(true);
    const result = await checkInTestDriveAction({ id: data.id, expectedUpdatedAt: data.updatedAt, verified });
    setIsSaving(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Customer Checked In Successfully");
    onDone();
  };

  const dialPhone = data?.customer.phone.replace(/[^\d+]/g, "") ?? "";

  return (
    <Modal
      isOpen
      onClose={isSaving ? () => undefined : onClose}
      title="Check in customer"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {alreadyIn ? "Close" : "Cancel"}
          </Button>
          {!alreadyIn && (
            <Button
              onClick={handleCheckIn}
              isLoading={isSaving}
              disabled={!canCheckIn}
              leftIcon={<LogIn className="size-4" />}
            >
              Check In Customer
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TestDriveActionSummary subject={subject} />

        {loadFailed ? (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            We couldn&apos;t load this appointment, or you don&apos;t have permission to check customers in.
            Close this and try again.
          </p>
        ) : !data ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : alreadyIn ? (
          <p
            role="status"
            className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>
              This customer checked in at <strong>{formatTime(data.checkedInAt as string)}</strong>
              {data.checkedInByName ? ` (by ${data.checkedInByName})` : ""}.
            </span>
          </p>
        ) : (
          <>
            <section aria-labelledby="verify-appointment" className="flex flex-col gap-3">
              <h3 id="verify-appointment" className="text-label">
                1. Verify the appointment
              </h3>
              <ul className="border-border flex flex-col gap-3 rounded-md border p-3">
                <CheckRow ok={statusOk} label="Status">
                  {data.status}
                </CheckRow>
                <CheckRow ok={windowOpen} label="Check-in window">
                  {windowInfo?.text}
                </CheckRow>
                <CheckRow ok label="Appointment">
                  {formatDayLong(data.scheduledStart)} ·{" "}
                  {formatTimeRange(data.scheduledStart, data.scheduledEnd)}
                </CheckRow>
                <CheckRow ok label="Showroom">
                  {data.locationName}
                </CheckRow>
                <CheckRow ok label="Vehicle">
                  {data.vehicleTitle}
                </CheckRow>
                <CheckRow ok={!!data.hostName} label="Host">
                  {data.hostName ?? "No host assigned"}
                </CheckRow>
              </ul>
            </section>

            <section aria-labelledby="verify-customer" className="flex flex-col gap-3">
              <h3 id="verify-customer" className="text-label">
                2. Verify the customer
              </h3>
              <div className="border-border flex flex-col gap-2 rounded-md border p-3">
                <p className="text-text-primary font-medium">{data.customer.name}</p>
                <p className="text-caption text-text-subtle">{data.customer.number}</p>
                {data.customer.phone ? (
                  <a
                    href={`tel:${dialPhone}`}
                    className="text-body-sm text-text-primary hover:text-primary-text focus-visible:ring-primary inline-flex items-center gap-2 self-start rounded focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Phone className="text-text-muted size-4" aria-hidden="true" />
                    {data.customer.phone}
                    <span className="sr-only"> (call)</span>
                  </a>
                ) : (
                  <p className="text-body-sm text-text-subtle">No phone number on file.</p>
                )}
              </div>
              <p className="text-caption text-text-subtle">
                Ask the customer for their name and phone number, and check them against the details above.
              </p>
              <Switch
                label={`I've confirmed this is ${data.customer.name}`}
                checked={verified}
                onCheckedChange={setVerified}
              />
            </section>

            <p className="text-caption text-text-subtle">
              Checking in records the arrival time and your name. It can&apos;t be changed afterwards, and the
              host is told.
            </p>

            {hint && (
              <p role="status" className="text-body-sm text-text-muted">
                {hint}
              </p>
            )}
          </>
        )}

        {error && (
          <p
            role="alert"
            className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
