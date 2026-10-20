/* =========================================================
   TYPES
========================================================= */

export type DateValue = string | Date | null | undefined;

/* =========================================================
   CONSTANTS
========================================================= */

const DUBAI_TIME_ZONE = "Asia/Dubai";

const DUBAI_UTC_OFFSET_HOURS = 4;

const DUBAI_UTC_OFFSET_MS = DUBAI_UTC_OFFSET_HOURS * 60 * 60 * 1000;

/* =========================================================
   FORMATTERS
========================================================= */

const dateTimeFormat = new Intl.DateTimeFormat("en-AE", {
  timeZone: DUBAI_TIME_ZONE,

  day: "2-digit",

  month: "short",

  year: "numeric",

  hour: "2-digit",

  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("en-AE", {
  timeZone: DUBAI_TIME_ZONE,

  day: "2-digit",

  month: "short",

  year: "numeric",
});

const timeFormat = new Intl.DateTimeFormat("en-AE", {
  timeZone: DUBAI_TIME_ZONE,

  hour: "2-digit",

  minute: "2-digit",
});

/* =========================================================
   INTERNAL DATE NORMALIZER
========================================================= */

function toValidDate(value: DateValue): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* =========================================================
   DUBAI DATE PARTS
========================================================= */

interface DubaiDateParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

function getDubaiDateParts(value: DateValue): DubaiDateParts | null {
  const date = toValidDate(value);

  if (!date) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: DUBAI_TIME_ZONE,

    year: "numeric",

    month: "2-digit",

    day: "2-digit",

    hour: "2-digit",

    minute: "2-digit",

    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const year = getPart("year");

  const month = getPart("month");

  const day = getPart("day");

  const hour = getPart("hour");

  const minute = getPart("minute");

  if (!year || !month || !day || !hour || !minute) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
  };
}

/* =========================================================
   ISO UTC -> DUBAI DATE INPUT
========================================================= */

/**
 * Returns YYYY-MM-DD in Dubai time.
 *
 * Intended for:
 * <input type="date" />
 */
export function toDubaiDateInput(value: DateValue): string {
  const parts = getDubaiDateParts(value);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

/* =========================================================
   ISO UTC -> DUBAI TIME INPUT
========================================================= */

/**
 * Returns HH:mm in Dubai time.
 *
 * Intended for:
 * <input type="time" />
 */
export function toDubaiTimeInput(value: DateValue): string {
  const parts = getDubaiDateParts(value);

  if (!parts) {
    return "";
  }

  return `${parts.hour}:${parts.minute}`;
}

/* =========================================================
   DUBAI LOCAL DATE/TIME -> ISO UTC
========================================================= */

/**
 * Converts a Dubai-local date + time
 * into a UTC ISO timestamp.
 *
 * Example:
 *
 * dubaiToIso(
 *   "2026-10-20",
 *   "14:30"
 * )
 *
 * returns:
 * 2026-10-20T10:30:00.000Z
 */
export function dubaiToIso(date: string, time: string): string {
  const trimmedDate = date.trim();

  const trimmedTime = time.trim();

  if (!trimmedDate || !trimmedTime) {
    throw new Error("A valid Dubai date and time are required.");
  }

  /* ---------------------------------------------------------
     DATE
  --------------------------------------------------------- */

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);

  if (!dateMatch) {
    throw new Error(`Invalid date format: "${date}". Expected YYYY-MM-DD.`);
  }

  const year = Number(dateMatch[1]);

  const month = Number(dateMatch[2]);

  const day = Number(dateMatch[3]);

  /* ---------------------------------------------------------
     TIME
  --------------------------------------------------------- */

  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmedTime);

  if (!timeMatch) {
    throw new Error(`Invalid time format: "${time}". Expected HH:mm or HH:mm:ss.`);
  }

  const hour = Number(timeMatch[1]);

  const minute = Number(timeMatch[2]);

  const second = Number(timeMatch[3] ?? "0");

  /* ---------------------------------------------------------
     RANGE VALIDATION
  --------------------------------------------------------- */

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in date: "${date}".`);
  }

  if (day < 1 || day > 31) {
    throw new Error(`Invalid day in date: "${date}".`);
  }

  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour in time: "${time}".`);
  }

  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute in time: "${time}".`);
  }

  if (second < 0 || second > 59) {
    throw new Error(`Invalid second in time: "${time}".`);
  }

  /* ---------------------------------------------------------
     VALIDATE CALENDAR DATE
  --------------------------------------------------------- */

  const validationDate = new Date(Date.UTC(year, month - 1, day));

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: "${date}".`);
  }

  /* ---------------------------------------------------------
     DUBAI -> UTC
  --------------------------------------------------------- */

  const dubaiTimestamp = Date.UTC(year, month - 1, day, hour, minute, second, 0);

  const utcTimestamp = dubaiTimestamp - DUBAI_UTC_OFFSET_MS;

  return new Date(utcTimestamp).toISOString();
}

/* =========================================================
   FORMAT DATE + TIME
========================================================= */

export function formatDateTime(value: DateValue): string {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  return dateTimeFormat.format(date);
}

/* =========================================================
   FORMAT DATE
========================================================= */

export function formatDate(value: DateValue): string {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  return dateFormat.format(date);
}

/* =========================================================
   FORMAT TIME
========================================================= */

export function formatTime(value: DateValue): string {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  return timeFormat.format(date);
}

/* =========================================================
   VALIDATION
========================================================= */

export function isValidDateValue(value: DateValue): boolean {
  return toValidDate(value) !== null;
}
