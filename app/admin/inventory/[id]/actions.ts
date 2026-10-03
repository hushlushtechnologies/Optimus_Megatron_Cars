"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";

export async function updateCarAvailabilityStatus(carId: string, statusId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cars").update({ availability_status_id: statusId }).eq("id", carId);

  if (error) {
    console.error("updateCarAvailabilityStatus error:", error);
    return { error: "Unable to update status. Please try again." };
  }

  revalidatePath(`/admin/inventory/${carId}`);
  revalidatePath("/admin/inventory");
  return { error: null };
}
