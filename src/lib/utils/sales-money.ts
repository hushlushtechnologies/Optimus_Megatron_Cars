/**
 * Money is handled as whole fils (1/100 of a dirham)
 * using bigint, never as a floating-point number.
 *
 * The database remains the authority for stored amounts.
 * These helpers are for entering, adding, subtracting,
 * comparing and displaying monetary values safely.
 */

export type Fils = bigint;

/* =========================================================
   CONSTANTS
========================================================= */

const ZERO = BigInt(0);

const ONE_HUNDRED = BigInt(100);

const DECIMAL_RE = /^-?\d{1,12}(\.\d{1,2})?$/;

/* =========================================================
   PARSE VALUE TO FILS
========================================================= */

/**
 * Converts user input or a database value into fils.
 *
 * Examples:
 *
 * "1234.50" -> 123450 fils
 * 1234.5    -> 123450 fils
 *
 * Strings containing more than two decimal places are
 * rejected rather than rounded.
 *
 * Numbers are accepted because database APIs may return
 * numeric values as JavaScript numbers.
 */
export function toFils(value: string | number | null | undefined): Fils | null {
  if (value === null || value === undefined) {
    return null;
  }

  let text: string;

  /* ---------------------------------------------------------
     NUMBER INPUT
  --------------------------------------------------------- */

  if (typeof value === "number") {
    if (!Number.isFinite(value) || Math.abs(value) > 999_999_999_999.99) {
      return null;
    }

    text = value.toFixed(2);
  } else {
    /* -------------------------------------------------------
       STRING INPUT
    ------------------------------------------------------- */

    text = value.trim().replace(/,/g, "");
  }

  /* ---------------------------------------------------------
     VALIDATE
  --------------------------------------------------------- */

  if (!DECIMAL_RE.test(text)) {
    return null;
  }

  /* ---------------------------------------------------------
     SIGN
  --------------------------------------------------------- */

  const negative = text.startsWith("-");

  const unsigned = negative ? text.slice(1) : text;

  /* ---------------------------------------------------------
     WHOLE + FRACTION
  --------------------------------------------------------- */

  const [whole, fraction = ""] = unsigned.split(".");

  const wholeFils = BigInt(whole) * ONE_HUNDRED;

  const fractionFils = BigInt(fraction.padEnd(2, "0"));

  const fils = wholeFils + fractionFils;

  return negative ? -fils : fils;
}

/* =========================================================
   FILS -> DATABASE DECIMAL STRING
========================================================= */

/**
 * Converts fils into a decimal string suitable for
 * sending to the database.
 *
 * Example:
 *
 * 123450 fils -> "1234.50"
 */
export function filsToDecimalString(fils: Fils): string {
  const negative = fils < ZERO;

  const absolute = negative ? -fils : fils;

  const whole = absolute / ONE_HUNDRED;

  const fraction = (absolute % ONE_HUNDRED).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

/* =========================================================
   ADD
========================================================= */

export function addFils(...values: Fils[]): Fils {
  return values.reduce((total, value) => total + value, ZERO);
}

/* =========================================================
   SUBTRACT
========================================================= */

export function subtractFils(
  left: Fils,

  right: Fils,
): Fils {
  return left - right;
}

/* =========================================================
   COMPARE
========================================================= */

export function compareFils(
  left: Fils,

  right: Fils,
): -1 | 0 | 1 {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

/* =========================================================
   FORMAT
========================================================= */

/**
 * Formats fils without converting through JavaScript
 * floating-point numbers.
 *
 * Example:
 *
 * 1234560 fils -> "AED 12,345.60"
 */
export function formatFils(
  fils: Fils | null,

  currency = "AED",
): string {
  if (fils === null) {
    return "—";
  }

  const decimal = filsToDecimalString(fils);

  const negative = decimal.startsWith("-");

  const [whole, fraction] = decimal.replace("-", "").split(".");

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${negative ? "-" : ""}${currency} ${grouped}.${fraction}`;
}
