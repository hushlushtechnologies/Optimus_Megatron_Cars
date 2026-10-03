"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageInventory } from "@/src/lib/supabase/inventory-permissions";

export async function deleteCars(carIds: string[]) {
  const permission = await assertCanManageInventory();
  if (!permission.allowed) return { error: permission.error };

  if (carIds.length === 0) {
    return { error: "No vehicles selected." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cars").delete().in("id", carIds);

  if (error) {
    console.error("deleteCars error:", error);
    return {
      error: "Unable to delete the selected vehicle(s). Please try again.",
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function archiveCars(carIds: string[]) {
  const permission = await assertCanManageInventory();
  if (!permission.allowed) return { error: permission.error };

  if (carIds.length === 0) {
    return { error: "No vehicles selected." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cars")
    .update({ archived_at: new Date().toISOString() })
    .in("id", carIds);

  if (error) {
    console.error("archiveCars error:", error);
    return {
      error: "Unable to archive the selected vehicle(s). Please try again.",
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function restoreCars(carIds: string[]) {
  const permission = await assertCanManageInventory();
  if (!permission.allowed) return { error: permission.error };

  if (carIds.length === 0) {
    return { error: "No vehicles selected." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cars").update({ archived_at: null }).in("id", carIds);

  if (error) {
    console.error("restoreCars error:", error);
    return {
      error: "Unable to restore the selected vehicle(s). Please try again.",
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function updateCarsAvailabilityStatus(carIds: string[], statusId: string) {
  const permission = await assertCanManageInventory();
  if (!permission.allowed) return { error: permission.error };

  if (carIds.length === 0) {
    return { error: "No vehicles selected." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cars").update({ availability_status_id: statusId }).in("id", carIds);

  if (error) {
    console.error("updateCarsAvailabilityStatus error:", error);
    return {
      error: "Unable to update status for the selected vehicle(s). Please try again.",
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}

export async function assignCarsCollection(carIds: string[], collectionId: string) {
  const permission = await assertCanManageInventory();
  if (!permission.allowed) return { error: permission.error };

  if (carIds.length === 0) {
    return { error: "No vehicles selected." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cars")
    .update({ collection_id: collectionId || null })
    .in("id", carIds);

  if (error) {
    console.error("assignCarsCollection error:", error);
    return {
      error: "Unable to assign a collection to the selected vehicle(s). Please try again.",
    };
  }

  revalidatePath("/admin/inventory");
  return { error: null };
}
