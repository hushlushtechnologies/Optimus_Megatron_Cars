import { formatTime } from "@/src/lib/utils/test-drive-format";
import type { CheckInWindowState } from "@/src/lib/types/test-drive";

export const DEFAULT_CHECK_IN_OPENS_MINUTES = 60;

interface WindowInput {
  nowMs: number;
  startIso: string;
  endIso: string;
  /** How many minutes before the start check-in opens. A showroom setting. */
  opensBeforeMinutes: number;
}

/**
 * Whether a customer can be checked in right now. Open from a set time before
 * the start until the appointment ends. The database applies the same rule,
 * so this can never disagree with what it will accept.
 */
export function getCheckInWindow({
  nowMs,
  startIso,
  endIso,
  opensBeforeMinutes,
}: WindowInput): CheckInWindowState {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  const opensAtMs = startMs - opensBeforeMinutes * 60_000;

  if (nowMs < opensAtMs) return { state: "too_early", opensAtIso: new Date(opensAtMs).toISOString() };
  if (nowMs > endMs) return { state: "ended" };
  return { state: "open", late: nowMs > startMs };
}

/** The sentence a person reads, and whether check-in can go ahead. */
export function describeCheckInWindow(window: CheckInWindowState): { ok: boolean; text: string } {
  switch (window.state) {
    case "too_early":
      return { ok: false, text: `Check-in opens at ${formatTime(window.opensAtIso)}.` };
    case "ended":
      return {
        ok: false,
        text: "This appointment has ended, so the customer can no longer be checked in. Reschedule it, or mark it as a no show.",
      };
    case "open":
      return {
        ok: true,
        text: window.late ? "Check-in is open. The appointment has already started." : "Check-in is open.",
      };
  }
}
