"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

import type { RelationshipType, RelationshipStatus } from "@/src/lib/types/customer";

/* =========================================================
   TYPES
========================================================= */

interface VehicleRelationCar {
  display_title: string;
}

type VehicleRelationCarRelation = VehicleRelationCar | VehicleRelationCar[] | null;

/* =========================================================
   HELPERS
========================================================= */

function normalizeRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/* =========================================================
   ADD VEHICLE RELATION
========================================================= */

export async function addVehicleRelation(
  customerId: string,
  carId: string,
  relationshipType: RelationshipType,
  assignedStaffId: string | null,
) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return { error: permission.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_vehicle_relations")
    .insert({
      customer_id: customerId,
      car_id: carId,
      relationship_type: relationshipType,
      assigned_staff_id: assignedStaffId,
    })
    .select("id, car:cars(display_title)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "This customer already has that exact relationship with this vehicle.",
      };
    }

    console.error("addVehicleRelation error:", error);

    return {
      error: "Unable to link this vehicle. Please try again.",
    };
  }

  const rawCar = data.car as unknown as VehicleRelationCarRelation;

  const car = normalizeRelation(rawCar);

  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "vehicle_relation_added",
    description: `${relationshipType}: ${car?.display_title ?? "a vehicle"}`,
    related_car_id: carId,
  });

  revalidatePath(`/admin/customers/${customerId}`);

  return { error: null };
}

/* =========================================================
   ASSIGN RELATION STAFF
========================================================= */

export async function assignRelationStaff(relationId: string, staffId: string, customerId: string) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return { error: permission.error };
  }

  const supabase = await createClient();

  const { data: before } = await supabase
    .from("customer_vehicle_relations")
    .select("assigned_staff_id")
    .eq("id", relationId)
    .single();

  const { error } = await supabase
    .from("customer_vehicle_relations")
    .update({
      assigned_staff_id: staffId,
    })
    .eq("id", relationId);

  if (error) {
    console.error("assignRelationStaff error:", error);

    return {
      error: "Unable to assign staff. Please try again.",
    };
  }

  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: before?.assigned_staff_id ? "staff_reassigned" : "staff_assigned",
    description: before?.assigned_staff_id
      ? "Staff reassigned on a vehicle deal"
      : "Staff assigned to a vehicle deal",
  });

  revalidatePath(`/admin/customers/${customerId}`);

  return { error: null };
}

/* =========================================================
   CHANGE RELATIONSHIP STATUS
========================================================= */

export async function changeRelationshipStatus(
  relationId: string,
  status: RelationshipStatus,
  customerId: string,
) {
  const permission = await assertCanManageCustomers();

  if (!permission.allowed) {
    return { error: permission.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_vehicle_relations")
    .update({
      relationship_status: status,
    })
    .eq("id", relationId);

  if (error) {
    console.error("changeRelationshipStatus error:", error);

    return {
      error: "Unable to update status. Please try again.",
    };
  }

  await supabase.from("customer_activity").insert({
    customer_id: customerId,
    activity_type: "relationship_status_changed",
    new_value: status,
    description: `Relationship status changed to ${status}`,
  });

  revalidatePath(`/admin/customers/${customerId}`);

  return { error: null };
}

/* =========================================================
   SEARCH CARS
========================================================= */

export async function searchCarsForLink() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cars")
    .select("id, display_title, stock_id")
    .is("archived_at", null)
    .order("created_at", {
      ascending: false,
    })
    .limit(200);

  return data ?? [];
}

/* =========================================================
   ASSIGNMENT HISTORY
========================================================= */

export async function getAssignmentHistoryAction(relationId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("customer_staff_assignment_history")
    .select(
      `
        id,
        previous_staff_id,
        new_staff_id,
        changed_by,
        changed_at
      `,
    )
    .eq("relation_id", relationId)
    .order("changed_at", {
      ascending: false,
    });

  const ids = new Set<string>();

  (data ?? []).forEach((row) => {
    if (row.previous_staff_id) {
      ids.add(row.previous_staff_id);
    }

    if (row.new_staff_id) {
      ids.add(row.new_staff_id);
    }

    if (row.changed_by) {
      ids.add(row.changed_by);
    }
  });

  const { data: profiles } = ids.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(ids))
    : { data: [] };

  const nameOf = (id: string | null) => {
    if (!id) {
      return "Unassigned";
    }

    return profiles?.find((profile) => profile.id === id)?.full_name ?? "Unknown";
  };

  return (data ?? []).map((row) => ({
    id: row.id,
    previousStaffName: nameOf(row.previous_staff_id),
    newStaffName: nameOf(row.new_staff_id),
    changedByName: nameOf(row.changed_by),
    changedAt: row.changed_at,
  }));
}
