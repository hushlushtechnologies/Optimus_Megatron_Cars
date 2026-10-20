"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Flame, Scale, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  INTEREST_LEVELS,
  testDriveFeedbackSchema,
  type TestDriveFeedbackValues,
} from "@/src/lib/validation/test-drive-feedback";
import { cn } from "@/src/lib/utils/cn";

const INTEREST_ICON: Record<(typeof INTEREST_LEVELS)[number], LucideIcon> = {
  "Very Interested": Flame,
  Interested: ThumbsUp,
  Considering: Scale,
  "Not Interested": ThumbsDown,
};

interface TestDriveFeedbackFormProps {
  defaultValues?: Partial<TestDriveFeedbackValues>;
  onSubmit: (values: TestDriveFeedbackValues) => void | Promise<void>;
  isSubmitting?: boolean;
  /** A save error to show above the buttons. */
  errorMessage?: string;
  submitLabel?: string;
  /** Lets a modal footer button submit this form: <Button form={formId} type="submit">. */
  formId?: string;
  hideActions?: boolean;
  readOnly?: boolean;
  /** Reports whether anything has been changed, so a dialog can protect unsaved work. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Called when submit is pressed but some fields are invalid. */
  onInvalid?: () => void;
}

export function TestDriveFeedbackForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel = "Save Feedback",
  formId,
  hideActions,
  readOnly,
  onDirtyChange,
  onInvalid,
}: TestDriveFeedbackFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TestDriveFeedbackValues>({
    resolver: zodResolver(testDriveFeedbackSchema),
    defaultValues: {
      staff_feedback: "",
      customer_feedback: "",
      next_step: "",
      follow_up_required: false,
      ...defaultValues,
    },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit, () => onInvalid?.())}
      noValidate
      className="flex flex-col gap-5"
    >
      <fieldset disabled={readOnly} className="flex flex-col gap-5">
        <Controller
          control={control}
          name="interest_level"
          render={({ field }) => (
            <fieldset
              className="flex flex-col gap-2"
              aria-describedby={errors.interest_level ? "interest-level-error" : undefined}
            >
              <legend className="text-label">
                Customer interest
                <span className="ml-0.5 text-red-400" aria-hidden="true">
                  *
                </span>
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {INTEREST_LEVELS.map((level) => {
                  const Icon = INTEREST_ICON[level];
                  const selected = field.value === level;

                  return (
                    <label key={level} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name={field.name}
                        value={level}
                        checked={selected}
                        onChange={() => field.onChange(level)}
                        onBlur={field.onBlur}
                        className="peer sr-only"
                      />
                      <span
                        className={cn(
                          "peer-focus-visible:ring-primary flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors duration-150 peer-focus-visible:ring-2 motion-reduce:transition-none",
                          selected
                            ? "border-primary bg-primary/10 text-primary-text"
                            : "border-border bg-card text-text-primary hover:bg-card-hover",
                        )}
                      >
                        <Icon className="size-5" aria-hidden="true" />
                        <span className="text-body-sm font-medium">{level}</span>
                        {selected && <Check className="size-3.5" aria-hidden="true" />}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.interest_level && (
                <p id="interest-level-error" role="alert" className="text-body-sm text-red-500">
                  {errors.interest_level.message}
                </p>
              )}
            </fieldset>
          )}
        />

        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Staff feedback"
            placeholder="How did the drive go? Anything worth passing on to the team."
            rows={3}
            {...register("staff_feedback")}
          />
          {errors.staff_feedback && (
            <p role="alert" className="text-body-sm text-red-500">
              {errors.staff_feedback.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Customer feedback"
            placeholder="What did the customer say about the vehicle?"
            rows={3}
            {...register("customer_feedback")}
          />
          {errors.customer_feedback && (
            <p role="alert" className="text-body-sm text-red-500">
              {errors.customer_feedback.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Textarea
            label="Recommended next step"
            placeholder="For example: send a finance quote, or schedule a second drive."
            rows={2}
            {...register("next_step")}
          />
          {errors.next_step && (
            <p role="alert" className="text-body-sm text-red-500">
              {errors.next_step.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Controller
            control={control}
            name="follow_up_required"
            render={({ field }) => (
              <Switch label="Follow-up required" checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <p className="text-caption text-text-subtle">
            Flags this drive so the team contacts the customer afterwards.
          </p>
        </div>
      </fieldset>

      {errorMessage && (
        <p
          role="alert"
          className="text-body-sm text-text-primary rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2"
        >
          {errorMessage}
        </p>
      )}

      {!hideActions && !readOnly && (
        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
