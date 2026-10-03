import { createClient } from "@/src/lib/supabase/server";
import type { CarMedia } from "@/src/lib/types/inventory";

export async function getCarMedia(carId: string): Promise<CarMedia[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("car_media").select("*").eq("car_id", carId).order("sort_order");

  return (data ?? []) as CarMedia[];
}
