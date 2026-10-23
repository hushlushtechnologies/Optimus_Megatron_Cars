import { formatFils, toFils } from "@/src/lib/utils/sales-money";

/* =========================================================
   BIGINT CONSTANTS
========================================================= */

const ZERO = BigInt(0);

const ONE_HUNDRED = BigInt(100);

/* =========================================================
   MONEY FORMAT
========================================================= */

export function formatMoney(
  value: number | null | undefined,

  currency = "AED",
): string {
  return formatFils(toFils(value ?? null), currency);
}

/* =========================================================
   PAID PERCENT
========================================================= */

/**
 * Whole-number percentage of the total
 * that is verified as paid.
 *
 * Returns null when there is no valid
 * positive total yet.
 */
export function paidPercent(
  total: number | null,

  paid: number | null,
): number | null {
  const totalFils = toFils(total);

  if (totalFils === null || totalFils <= ZERO) {
    return null;
  }

  const paidFils = toFils(paid) ?? ZERO;

  const percent = Number((paidFils * ONE_HUNDRED) / totalFils);

  return Math.max(0, Math.min(100, percent));
}

/* =========================================================
   EXPIRY
========================================================= */

export type ExpiryTone = "calm" | "soon" | "urgent" | "expired";

/* =========================================================
   TIME LEFT
========================================================= */

export function describeTimeLeft(
  expiresAtMs: number,

  nowMs: number,
): {
  label: string;
  tone: ExpiryTone;
} {
  const left = expiresAtMs - nowMs;

  if (left <= 0) {
    return {
      label: "Expired",

      tone: "expired",
    };
  }

  const minutes = Math.floor(left / 60_000);

  const hours = Math.floor(minutes / 60);

  const days = Math.floor(hours / 24);

  if (minutes < 60) {
    return {
      label: `${Math.max(minutes, 1)}m left`,

      tone: "urgent",
    };
  }

  if (hours < 3) {
    return {
      label: `${hours}h ${minutes % 60}m left`,

      tone: "urgent",
    };
  }

  if (hours < 24) {
    return {
      label: `${hours}h ${minutes % 60}m left`,

      tone: "soon",
    };
  }

  return {
    label: `${days}d ${hours % 24}h left`,

    tone: "calm",
  };
}
