export interface SalesDbErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

const SL_CODES = ["SL001", "SL002", "SL003", "SL004", "SL005", "SL006", "SL007"];

/**
 * Turns a database error into a message a staff member can act on. The SL messages are written
 * in the triggers for exactly this purpose, so they are shown as they are. Anything else gets a
 * fixed message: raw database text is never shown.
 */
export function mapSalesDbError(error: SalesDbErrorLike): string {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;

  if (error.code && SL_CODES.includes(error.code) && error.message) return error.message;

  switch (error.code) {
    case "23P01":
      return "This vehicle already has a confirmed reservation for that period.";
    case "23505":
      if (text.includes("sales_deals_one_hold_per_car"))
        return "This vehicle is already held by another deal.";
      if (text.includes("sales_deals_one_open_per_customer_car"))
        return "This customer already has an open deal for this vehicle.";
      if (text.includes("sales_deals_reservation_once"))
        return "That reservation is already linked to a deal.";
      if (text.includes("sales_payments_unique_reference"))
        return "A payment with this method and reference is already recorded.";
      return "That record already exists.";
    case "23514":
      return "Some details are not valid. Please check the form and try again.";
    case "23503":
      return "One of the selected records no longer exists. Refresh the page and try again.";
    default:
      return "Your changes could not be saved. Please try again.";
  }
}

export function isVehicleConflictError(error: SalesDbErrorLike): boolean {
  return (
    error.code === "23P01" ||
    error.code === "SL003" ||
    (error.code === "23505" && (error.message ?? "").includes("one_hold_per_car"))
  );
}
