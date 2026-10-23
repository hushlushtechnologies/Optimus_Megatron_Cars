import type { SalesDealStatus } from "@/src/lib/types/sales";

export type SalesView = "table" | "grid" | "board";

export type SalesSort =
  "recently-updated" | "newest" | "oldest" | "value-desc" | "value-asc" | "balance-desc";

/** One row of public.sales_deal_list. Names are already resolved. */
export interface SalesListRow {
  id: string;
  deal_number: string;
  status: SalesDealStatus;
  created_at: string;
  updated_at: string;
  customer_id: string;
  customer_name: string;
  customer_number: string;
  customer_photo_url: string | null;
  car_id: string;
  vehicle_title: string;
  stock_id: string;
  brand_name: string | null;
  model_name: string | null;
  location_id: string;
  location_name: string;
  owner_id: string | null;
  owner_name: string | null;
  lead_id: string | null;
  lead_number: string | null;
  reservation_id: string | null;
  reservation_number: string | null;
  reservation_expires_at: string | null;
  reservation_status: string | null;
  currency: string;
  listed_price: number | null;
  proposed_price: number | null;
  discount_amount: number;
  agreed_price: number | null;
  total_due: number | null;
  verified_paid: number | null;
  awaiting_verification: number | null;
  balance_due: number | null;
}

export interface SalesSummary {
  openCount: number;
  reservedCount: number;
  confirmedCount: number;
  completedMonthCount: number;
  completedMonthValue: number;
  outstandingBalance: number;
  pipelineValue: number;
  expiringHolds: number;
}

export interface SalesBoardColumn {
  status: SalesDealStatus;
  rows: SalesListRow[];
  total: number;
}
