"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { useForm, useWatch, type FieldPath, type FieldPathValue } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ArrowLeft, TriangleAlert } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";

import { CustomerSection } from "@/src/components/test-drives/form/customer-section";
import { VehicleSection } from "@/src/components/test-drives/form/vehicle-section";
import { LeadSection } from "@/src/components/test-drives/form/lead-section";
import { ScheduleSection } from "@/src/components/test-drives/form/schedule-section";
import { StaffSection } from "@/src/components/test-drives/form/staff-section";
import { NotesSection } from "@/src/components/test-drives/form/notes-section";
import { TestDriveSummaryCard } from "@/src/components/test-drives/form/test-drive-summary-card";

import type { NearestPanel } from "@/src/components/test-drives/form/nearest-slots";

import {
  createTestDrive,
  getCustomerOpenLeadsAction,
  getMonthAvailabilityAction,
  getNearestSlotsAction,
  getShowroomScheduleInfoAction,
  getStaffAvailabilityAction,
  getTestDriveSlotsAction,
} from "@/app/admin/test-drives/new/actions";

import { useReducedMotion } from "@/src/hooks/use-reduced-motion";

import { createTestDriveSchema, type CreateTestDriveValues } from "@/src/lib/validation/test-drive";

import { getClosedDateReason } from "@/src/lib/utils/test-drive-slots";
import { toDayHints } from "@/src/lib/utils/test-drive-availability-logic";
import { getCalendarRange } from "@/src/lib/utils/test-drive-calendar";

import type {
  MonthAvailability,
  NearestSlot,
  SearchResult,
  ShowroomScheduleInfo,
  StaffAvailabilityMap,
  TestDriveCustomerOption,
  TestDriveFormLookups,
  TestDriveFormPrefill,
  TestDriveLeadOption,
  TestDriveSlotsResult,
  TestDriveVehicleOption,
} from "@/src/lib/types/test-drive";

/* =========================================================
   PROPS
========================================================= */

interface AddTestDriveFormProps {
  lookups: TestDriveFormLookups;
  prefill: TestDriveFormPrefill;
}

/**
 * The date and time the person wanted,
 * used to look for the nearest openings.
 */
interface SuggestTarget {
  date: string;
  time: string | null;
}

/* =========================================================
   COMPONENT
========================================================= */

export function AddTestDriveForm({ lookups, prefill }: AddTestDriveFormProps) {
  const router = useRouter();

  const prefersReducedMotion = useReducedMotion();

  const formRef = useRef<HTMLFormElement>(null);

  const skipUnloadWarning = useRef(false);

  const durationTouched = useRef(false);

  /* =========================================================
     LOCAL UI STATE
  ========================================================= */

  const [customer, setCustomer] = useState<TestDriveCustomerOption | null>(prefill.customer);

  const [vehicle, setVehicle] = useState<TestDriveVehicleOption | null>(prefill.vehicle);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const [refreshNonce, setRefreshNonce] = useState(0);

  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);

  const [conflictTarget, setConflictTarget] = useState<SuggestTarget | null>(null);

  const handleVisibleMonthChange = useCallback((monthStartIso: string) => {
    setVisibleMonth(monthStartIso);
  }, []);

  /* =========================================================
     DEFAULT VALUES
  ========================================================= */

  const initialLocation =
    prefill.vehicle?.location_id &&
    lookups.showrooms.some((showroom) => showroom.id === prefill.vehicle?.location_id)
      ? prefill.vehicle.location_id
      : lookups.showrooms.length === 1
        ? lookups.showrooms[0].id
        : "";

  const defaultSourceSlug = prefill.lead ? "from-lead" : "admin-dashboard";

  /* =========================================================
     FORM
  ========================================================= */

  const { register, handleSubmit, control, setValue, getValues, formState } = useForm<CreateTestDriveValues>({
    resolver: zodResolver(createTestDriveSchema),

    defaultValues: {
      customerId: prefill.customer?.id ?? "",

      carId: prefill.vehicle?.id ?? "",

      locationId: initialLocation,

      leadId: prefill.lead?.id ?? null,

      createLead: false,

      requestSourceId: lookups.requestSources.find((source) => source.slug === defaultSourceSlug)?.id ?? null,

      date: "",

      time: "",

      durationMinutes: 60,

      staffId: null,

      customerNotes: "",

      internalNotes: "",
    },
  });

  const { errors, isDirty, isSubmitting, isSubmitted } = formState;

  /* =========================================================
     WATCHED FORM VALUES
  ========================================================= */

  const customerId = useWatch({
    control,
    name: "customerId",
  });

  const carId = useWatch({
    control,
    name: "carId",
  });

  const locationId = useWatch({
    control,
    name: "locationId",
  });

  const leadId = useWatch({
    control,
    name: "leadId",
  });

  const createLead = useWatch({
    control,
    name: "createLead",
  });

  const date = useWatch({
    control,
    name: "date",
  });

  const time = useWatch({
    control,
    name: "time",
  });

  const durationMinutes = useWatch({
    control,
    name: "durationMinutes",
  });

  const staffId = useWatch({
    control,
    name: "staffId",
  });

  const requestSourceId = useWatch({
    control,
    name: "requestSourceId",
  });

  /* =========================================================
     SET FIELD HELPER
  ========================================================= */

  const setField = <TName extends FieldPath<CreateTestDriveValues>>(
    name: TName,
    value: FieldPathValue<CreateTestDriveValues, TName>,
  ) => {
    setValue(name, value, {
      shouldDirty: true,

      shouldValidate: isSubmitted,
    });
  };

  /* =========================================================
     SHOWROOM SCHEDULE
  ========================================================= */

  const [scheduleState, setScheduleState] = useState<{
    locationId: string;
    info: ShowroomScheduleInfo | null;
  } | null>(null);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    let cancelled = false;

    getShowroomScheduleInfoAction(locationId)
      .then((info) => {
        if (cancelled) {
          return;
        }

        setScheduleState({
          locationId,
          info,
        });

        if (!info) {
          return;
        }

        if (!durationTouched.current) {
          setValue("durationMinutes", info.settings.default_duration_minutes);
        }

        const chosenDate = getValues("date");

        if (chosenDate && getClosedDateReason(chosenDate, info)) {
          setValue("date", "", {
            shouldDirty: true,
          });

          setValue("time", "", {
            shouldDirty: true,
          });
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setScheduleState({
          locationId,
          info: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [locationId, setValue, getValues]);

  const scheduleReady = !!scheduleState && scheduleState.locationId === locationId;

  const scheduleInfo = scheduleState && scheduleReady ? scheduleState.info : null;

  const scheduleLoading = !!locationId && !scheduleReady;

  const scheduleFailed = !!locationId && scheduleReady && scheduleInfo === null;

  const scheduleEnabled = !!scheduleInfo?.enabled;

  /* =========================================================
     AVAILABLE TIME SLOTS
  ========================================================= */

  const [slotsState, setSlotsState] = useState<{
    key: string;

    result: TestDriveSlotsResult | null;
  } | null>(null);

  const slotsKey =
    carId && locationId && date && scheduleEnabled
      ? [carId, locationId, date, durationMinutes, staffId ?? "", refreshNonce].join("|")
      : null;

  useEffect(() => {
    if (!slotsKey) {
      return;
    }

    let cancelled = false;

    getTestDriveSlotsAction({
      carId,
      locationId,
      date,
      durationMinutes,
      staffId,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setSlotsState({
          key: slotsKey,

          result,
        });

        const chosen = getValues("time");

        if (chosen && result) {
          const slot = result.slots.find((candidate) => candidate.time === chosen);

          if (!slot || !slot.available) {
            setValue("time", "", {
              shouldDirty: true,
            });

            setConflictTarget({
              date,
              time: chosen,
            });

            toast.info(
              "That time isn't available with the current selection. Pick another, or choose one of the nearest openings.",
            );
          }
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSlotsState({
          key: slotsKey,

          result: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slotsKey, carId, locationId, date, durationMinutes, staffId, getValues, setValue]);

  const slotsReady = !!(slotsKey && slotsState && slotsState.key === slotsKey);

  const slotsResult = slotsKey && slotsState && slotsState.key === slotsKey ? slotsState.result : null;

  const slotsLoading = !!slotsKey && !slotsReady;

  const slotsFailed = slotsReady && slotsResult === null;

  /* =========================================================
     MONTH AVAILABILITY
  ========================================================= */

  const [monthState, setMonthState] = useState<{
    key: string;

    data: MonthAvailability | null;
  } | null>(null);

  const monthKey =
    carId && locationId && scheduleEnabled && visibleMonth
      ? [carId, locationId, visibleMonth, durationMinutes, staffId ?? "", refreshNonce].join("|")
      : null;

  useEffect(() => {
    if (!monthKey || !visibleMonth) {
      return;
    }

    let cancelled = false;

    const range = getCalendarRange("month", visibleMonth);

    getMonthAvailabilityAction({
      carId,
      locationId,
      durationMinutes,
      staffId,

      startDate: range.start,

      endDate: range.end,
    })
      .then((data) => {
        if (cancelled) {
          return;
        }

        setMonthState({
          key: monthKey,

          data,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setMonthState({
          key: monthKey,

          data: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [monthKey, visibleMonth, carId, locationId, durationMinutes, staffId]);

  const monthData = monthKey && monthState && monthState.key === monthKey ? monthState.data : null;

  const monthLoading = !!monthKey && !(monthState && monthState.key === monthKey);

  const dayHints = monthData ? toDayHints(monthData) : undefined;

  /* =========================================================
     STAFF AVAILABILITY
  ========================================================= */

  const [staffAvailState, setStaffAvailState] = useState<{
    key: string;

    map: StaffAvailabilityMap | null;
  } | null>(null);

  const staffKey =
    locationId && date && time && scheduleEnabled
      ? [locationId, date, time, durationMinutes, refreshNonce].join("|")
      : null;

  useEffect(() => {
    if (!staffKey) {
      return;
    }

    let cancelled = false;

    getStaffAvailabilityAction({
      locationId,
      date,
      time,
      durationMinutes,
    })
      .then((map) => {
        if (cancelled) {
          return;
        }

        setStaffAvailState({
          key: staffKey,

          map,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setStaffAvailState({
          key: staffKey,

          map: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [staffKey, locationId, date, time, durationMinutes]);

  const staffMap =
    staffKey && staffAvailState && staffAvailState.key === staffKey ? staffAvailState.map : null;

  const staffLoading = !!staffKey && !(staffAvailState && staffAvailState.key === staffKey);

  /* =========================================================
     NEAREST OPENINGS
  ========================================================= */

  const hasNoFreeTimes =
    !!slotsResult &&
    !slotsResult.closedReason &&
    slotsResult.slots.length > 0 &&
    !slotsResult.slots.some((slot) => slot.available);

  const suggestTarget: SuggestTarget | null =
    conflictTarget ??
    (hasNoFreeTimes && date
      ? {
          date,
          time: null,
        }
      : null);

  const suggestDate = suggestTarget?.date ?? null;

  const suggestTime = suggestTarget?.time ?? null;

  const suggestKey =
    suggestDate && carId && locationId && scheduleEnabled
      ? [
          carId,
          locationId,
          suggestDate,
          suggestTime ?? "",
          durationMinutes,
          staffId ?? "",
          refreshNonce,
          conflictTarget ? "conflict" : "full",
        ].join("|")
      : null;

  const [nearestState, setNearestState] = useState<{
    key: string;

    slots: NearestSlot[] | null;
  } | null>(null);

  useEffect(() => {
    if (!suggestKey || !suggestDate) {
      return;
    }

    let cancelled = false;

    getNearestSlotsAction({
      carId,
      locationId,

      date: suggestDate,

      time: suggestTime,

      durationMinutes,
      staffId,
    })
      .then((slots) => {
        if (cancelled) {
          return;
        }

        setNearestState({
          key: suggestKey,

          slots,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setNearestState({
          key: suggestKey,

          slots: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [suggestKey, suggestDate, suggestTime, carId, locationId, durationMinutes, staffId]);

  const nearestMatch = suggestKey && nearestState && nearestState.key === suggestKey ? nearestState : null;

  const nearestPanel: NearestPanel | null = suggestKey
    ? {
        heading: conflictTarget
          ? "That time is no longer available. Nearest openings:"
          : "Nothing is free on this date. Nearest openings:",

        slots: nearestMatch ? nearestMatch.slots : null,

        failed: !!nearestMatch && nearestMatch.slots === null,
      }
    : null;

  /* =========================================================
     CUSTOMER OPEN LEADS
  ========================================================= */

  const [leadsState, setLeadsState] = useState<{
    customerId: string;

    result: SearchResult<TestDriveLeadOption>;
  } | null>(null);

  useEffect(() => {
    if (!customerId) {
      return;
    }

    let cancelled = false;

    getCustomerOpenLeadsAction(customerId)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setLeadsState({
          customerId,
          result,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setLeadsState({
          customerId,

          result: {
            results: [],
            failed: true,
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const leadsResult = leadsState && leadsState.customerId === customerId ? leadsState.result : null;

  /* =========================================================
     BEFORE UNLOAD WARNING
  ========================================================= */

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      if (skipUnloadWarning.current) {
        return;
      }

      event.preventDefault();

      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [isDirty]);

  /* =========================================================
     CUSTOMER
  ========================================================= */

  const handleCustomerChange = (next: TestDriveCustomerOption | null) => {
    setCustomer(next);

    setField("customerId", next?.id ?? "");

    setField("leadId", null);

    setField("createLead", false);
  };

  /* =========================================================
     VEHICLE
  ========================================================= */

  const handleVehicleChange = (next: TestDriveVehicleOption | null) => {
    setVehicle(next);

    setField("carId", next?.id ?? "");

    setField("time", "");

    setConflictTarget(null);

    if (
      next?.location_id &&
      !getValues("locationId") &&
      lookups.showrooms.some((showroom) => showroom.id === next.location_id)
    ) {
      setField("locationId", next.location_id);
    }
  };

  /* =========================================================
     LOCATION
  ========================================================= */

  const handleLocationChange = (next: string) => {
    setField("locationId", next);

    setField("time", "");

    setConflictTarget(null);
  };

  /* =========================================================
     DATE
  ========================================================= */

  const handleDateChange = (iso: string) => {
    setField("date", iso);

    setField("time", "");

    setConflictTarget(null);
  };

  /* =========================================================
     TIME
  ========================================================= */

  const handleTimeChange = (next: string) => {
    setField("time", next);

    setConflictTarget(null);
  };

  /* =========================================================
     DURATION
  ========================================================= */

  const handleDurationChange = (minutes: number) => {
    durationTouched.current = true;

    setField("durationMinutes", minutes);

    setConflictTarget(null);
  };

  /* =========================================================
     STAFF
  ========================================================= */

  const handleStaffChange = (next: string | null) => {
    setField("staffId", next);

    setConflictTarget(null);
  };

  /* =========================================================
     REFRESH AVAILABILITY
  ========================================================= */

  const handleRefreshAvailability = () => {
    setConflictTarget(null);

    setRefreshNonce((current) => current + 1);
  };

  /* =========================================================
     PICK NEAREST SLOT
  ========================================================= */

  const handlePickNearest = (slot: NearestSlot) => {
    setConflictTarget(null);

    setField("date", slot.date);

    setField("time", slot.time);
  };

  /* =========================================================
     CANCEL
  ========================================================= */

  const handleCancel = () => {
    if (isDirty) {
      setConfirmCancelOpen(true);

      return;
    }

    router.push("/admin/test-drives");
  };

  /* =========================================================
     VALID SUBMIT
  ========================================================= */

  const onValid = async (values: CreateTestDriveValues) => {
    setSubmitError(null);

    const result = await createTestDrive(values);

    if (result.error) {
      setSubmitError(result.error);

      toast.error(result.error);

      if (result.refreshAvailability) {
        setConflictTarget({
          date: values.date,

          time: values.time,
        });

        setValue("time", "", {
          shouldDirty: true,
        });

        setRefreshNonce((current) => current + 1);
      }

      return;
    }

    skipUnloadWarning.current = true;

    toast.success(
      `Test Drive Created Successfully${result.testDriveNumber ? ` · ${result.testDriveNumber}` : ""}`,
    );

    if (result.warning) {
      toast.warning(result.warning);
    }

    router.push("/admin/test-drives");
  };

  /* =========================================================
     INVALID SUBMIT
  ========================================================= */

  const onInvalid = () => {
    toast.error("Please fix the highlighted fields.");

    formRef.current?.querySelector('[role="alert"]')?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",

      block: "center",
    });
  };

  /* =========================================================
     FORM SUBMIT
  ========================================================= */

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onValid, onInvalid)(event);
  };

  /* =========================================================
     DERIVED DISPLAY VALUES
  ========================================================= */

  const showroomName = lookups.showrooms.find((showroom) => showroom.id === locationId)?.name ?? null;

  const staffName = lookups.staff.find((staff) => staff.id === staffId)?.full_name ?? null;

  const showroomMismatchMessage =
    vehicle?.location_id && locationId && vehicle.location_id !== locationId
      ? `This vehicle is listed at ${
          vehicle.location_name ?? "another showroom"
        }, but the test drive is set for ${
          showroomName ?? "a different showroom"
        }. Make sure the car will be there.`
      : null;

  const selectedLead = leadsResult?.results.find((lead) => lead.id === leadId);

  const leadSummary = createLead
    ? "A new lead will be created"
    : leadId
      ? (selectedLead?.lead_number ?? "Linked")
      : "None";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="flex flex-col gap-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-start"
          leftIcon={<ArrowLeft className="size-4" />}
          onClick={handleCancel}
        >
          Test Drives
        </Button>

        <div>
          <h1 className="text-h1">Add Test Drive</h1>

          <p className="text-body-sm text-text-muted">
            Create a test drive request. It&apos;s saved as Pending until a manager approves it.
          </p>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form ref={formRef} onSubmit={handleFormSubmit} noValidate>
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            {/* CUSTOMER */}

            <CustomerSection
              value={customer}
              onChange={handleCustomerChange}
              error={errors.customerId?.message}
            />

            {/* VEHICLE */}

            <VehicleSection
              value={vehicle}
              onChange={handleVehicleChange}
              showroomMismatchMessage={showroomMismatchMessage}
              error={errors.carId?.message}
            />

            {/* LEAD */}

            <LeadSection
              hasCustomer={!!customerId}
              vehicleId={carId}
              leads={leadsResult}
              leadId={leadId}
              createLead={createLead}
              onChange={(nextLeadId, nextCreateLead) => {
                setField("leadId", nextLeadId);

                setField("createLead", nextCreateLead);
              }}
              error={errors.leadId?.message}
            />

            {/* SCHEDULE */}

            <ScheduleSection
              showrooms={lookups.showrooms}
              locationId={locationId}
              onLocationChange={handleLocationChange}
              scheduleInfo={scheduleInfo}
              scheduleLoading={scheduleLoading}
              scheduleFailed={scheduleFailed}
              hasVehicle={!!carId}
              date={date}
              time={time}
              durationMinutes={durationMinutes}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
              onDurationChange={handleDurationChange}
              slotsResult={slotsResult}
              slotsLoading={slotsLoading}
              slotsFailed={slotsFailed}
              onRefreshAvailability={handleRefreshAvailability}
              dayHints={dayHints}
              dayHintsLoading={monthLoading}
              onVisibleMonthChange={handleVisibleMonthChange}
              nearest={nearestPanel}
              onPickNearest={handlePickNearest}
              errors={{
                locationId: errors.locationId?.message,

                date: errors.date?.message,

                time: errors.time?.message,
              }}
            />

            {/* STAFF */}

            <StaffSection
              staff={lookups.staff}
              staffId={staffId}
              onChange={handleStaffChange}
              hasTime={!!date && !!time}
              availability={staffMap}
              availabilityLoading={staffLoading}
            />

            {/* NOTES */}

            <NotesSection
              register={register}
              requestSources={lookups.requestSources}
              requestSourceId={requestSourceId}
              onRequestSourceChange={(next) => setField("requestSourceId", next)}
              errors={{
                customerNotes: errors.customerNotes?.message,

                internalNotes: errors.internalNotes?.message,
              }}
            />

            {/* SUBMIT ERROR */}

            {submitError && (
              <p
                role="alert"
                className="text-body-sm text-text-primary flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2.5"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden="true" />

                {submitError}
              </p>
            )}

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>

              <Button type="submit" isLoading={isSubmitting}>
                Create Test Drive
              </Button>
            </div>
          </div>

          {/* SUMMARY */}

          <div className="xl:sticky xl:top-24">
            <TestDriveSummaryCard
              customer={customer}
              vehicle={vehicle}
              showroomName={showroomName}
              date={date}
              time={time}
              durationMinutes={durationMinutes}
              staffName={staffName}
              leadSummary={leadSummary}
            />
          </div>
        </div>
      </form>

      {/* =====================================================
          CANCEL CONFIRMATION
      ===================================================== */}

      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          skipUnloadWarning.current = true;

          router.push("/admin/test-drives");
        }}
        title="Discard this test drive?"
        description="You've started filling in this form. If you leave now, nothing will be saved."
        confirmLabel="Discard"
        variant="danger"
      />
    </div>
  );
}
