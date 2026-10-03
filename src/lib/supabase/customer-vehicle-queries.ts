import { createClient } from "@/src/lib/supabase/server";

import type { RelationshipType, RelationshipStatus } from "@/src/lib/types/customer";

/* =========================================================
   TYPES
========================================================= */

export interface VehicleRelationRow {
  id: string;
  relationship_type: RelationshipType;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  created_at: string;
  updated_at: string;

  car: {
    id: string;
    display_title: string;
    stock_id: string;
    featured_image_url: string | null;
  };
}

interface CarMediaRow {
  url: string;
  is_featured: boolean | null;
}

interface RawVehicleRelationRow {
  id: string;
  relationship_type: RelationshipType;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;

  car: {
    id: string;
    display_title: string;
    stock_id: string;
    media: CarMediaRow[] | null;
  };
}

/* =========================================================
   CUSTOMER VEHICLE RELATIONS
========================================================= */

export async function getCustomerVehicleRelations(customerId: string): Promise<VehicleRelationRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customer_vehicle_relations")
    .select(
      `
        id,
        relationship_type,
        relationship_status,
        assigned_staff_id,
        created_at,
        updated_at,
        car:cars(
          id,
          display_title,
          stock_id,
          media:car_media(
            url,
            is_featured
          )
        )
      `,
    )
    .eq("customer_id", customerId)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    console.error("[getCustomerVehicleRelations] relation query error:", error);

    return [];
  }

  const rows = (data ?? []) as unknown as RawVehicleRelationRow[];

  /* =========================================================
     LOAD STAFF NAMES SEPARATELY
  ========================================================= */

  const staffIds = [
    ...new Set(rows.map((row) => row.assigned_staff_id).filter((id): id is string => id !== null)),
  ];

  let staffNameMap = new Map<string, string | null>();

  if (staffIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", staffIds);

    if (profilesError) {
      console.error("[getCustomerVehicleRelations] staff query error:", profilesError);
    } else {
      staffNameMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    }
  }

  /* =========================================================
     NORMALIZE RESULT
  ========================================================= */

  return rows.map((relation) => {
    const featuredImage =
      relation.car.media?.find((media) => media.is_featured === true)?.url ??
      relation.car.media?.[0]?.url ??
      null;

    return {
      id: relation.id,
      relationship_type: relation.relationship_type,
      relationship_status: relation.relationship_status,

      assigned_staff_id: relation.assigned_staff_id,

      assigned_staff_name: relation.assigned_staff_id
        ? (staffNameMap.get(relation.assigned_staff_id) ?? null)
        : null,

      created_at: relation.created_at,
      updated_at: relation.updated_at,

      car: {
        id: relation.car.id,
        display_title: relation.car.display_title,
        stock_id: relation.car.stock_id,
        featured_image_url: featuredImage,
      },
    };
  });
}
