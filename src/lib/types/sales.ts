export type SalesDealStatus = "Draft" | "Negotiation" | "Reserved" | "Confirmed" | "Completed" | "Cancelled";

export const SALES_DEAL_STATUSES: SalesDealStatus[] = [
  "Draft",
  "Negotiation",
  "Reserved",
  "Confirmed",
  "Completed",
  "Cancelled",
];

/** Statuses that hold the vehicle for this deal. */
export const HOLDING_DEAL_STATUSES: SalesDealStatus[] = ["Reserved", "Confirmed", "Completed"];

export const FINAL_DEAL_STATUSES: SalesDealStatus[] = ["Completed", "Cancelled"];

// Mirrors the rules the database enforces in protect_sales_deal().
// The UI uses it to show only valid moves. The database remains the real gatekeeper.
export const SALES_DEAL_TRANSITIONS: Record<SalesDealStatus, SalesDealStatus[]> = {
  Draft: ["Negotiation", "Cancelled"],
  Negotiation: ["Reserved", "Confirmed", "Cancelled"],
  Reserved: ["Negotiation", "Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function canTransitionDeal(from: SalesDealStatus, to: SalesDealStatus): boolean {
  return SALES_DEAL_TRANSITIONS[from].includes(to);
}

export type ReservationStatus =
  "Requested" | "Confirmed" | "Converted" | "Cancelled" | "Released" | "Expired" | "Rejected";

export const RESERVATION_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  Requested: ["Confirmed", "Rejected", "Cancelled"],
  Confirmed: ["Converted", "Cancelled", "Released", "Expired"],
  Converted: [],
  Cancelled: [],
  Released: [],
  Expired: [],
  Rejected: [],
};

export type ReservationSource = "staff" | "website" | "phone" | "walk_in";

export type PaymentStatus = "Recorded" | "Verified" | "Rejected" | "Reversed";
export type PaymentDirection = "in" | "out";
export type PaymentKind = "Reservation Deposit" | "Deposit" | "Instalment" | "Balance" | "Refund";
export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Cheque" | "Finance Company" | "Other";

/** Only verified payments count toward what a customer has paid. */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  Recorded: ["Verified", "Rejected"],
  Verified: ["Reversed"],
  Rejected: [],
  Reversed: [],
};

export interface SalesSettings {
  currency: string;
  reservation_default_days: number;
  reservation_max_days: number;
  reservation_deposit_mode: "none" | "fixed" | "percent";
  reservation_deposit_value: number;
  confirm_min_deposit_percent: number;
  discount_auto_approve_percent: number;
  payments_require_separate_verifier: boolean;
  vat_rate_percent: number | null;
}

/** Error codes raised by the sales database triggers. */
export const SALES_DB_ERRORS = {
  INVALID_TRANSITION: "SL001",
  NOT_ALLOWED: "SL002",
  VEHICLE_HELD: "SL003",
  MISSING_DATA: "SL004",
  LOCKED: "SL005",
  PAYMENT_RULE: "SL006",
  RESERVATION_RULE: "SL007",
} as const;
