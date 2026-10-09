import { NextResponse } from "next/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";
import { getLeadAnalyticsSnapshot } from "@/src/lib/supabase/lead-analytics-queries";

// TEMPORARY: delete once you've confirmed the snapshot looks right.
export async function GET() {
  const permission = await assertCanManageCustomers();
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.error }, { status: 403 });
  }
  return NextResponse.json(await getLeadAnalyticsSnapshot());
}
