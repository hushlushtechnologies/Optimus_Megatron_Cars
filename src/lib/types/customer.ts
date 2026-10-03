export interface CustomerProfile {
  id: string;
  user_id: string | null;
  customer_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  alternative_phone: string | null;
  location_id: string | null;
  address: string | null;
  preferred_language: "English" | "Arabic" | "Other";
  lifecycle_status: "Prospect" | "Active" | "VIP" | "Inactive" | "Do Not Contact";
  account_status: "No Account" | "Pending Setup" | "Active" | "Disabled";
  source_id: string | null;
  source_detail: string | null;
  primary_relationship_manager_id: string | null;
  profile_photo_url: string | null;
  last_login: string | null;
  last_activity_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export type RelationshipType =
  | "Interested"
  | "Enquiry"
  | "Test Drive"
  | "Reserved"
  | "Purchased"
  | "Finance"
  | "Trade-In"
  | "Wishlist"
  | "Dream Car";
export type RelationshipStatus = "Active" | "Completed" | "Cancelled";

export interface CustomerVehicleRelation {
  id: string;
  customer_id: string;
  car_id: string;
  relationship_type: RelationshipType;
  relationship_status: RelationshipStatus;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  note_text: string;
  is_internal: boolean;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface CustomerActivityEntry {
  id: string;
  customer_id: string;
  activity_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  related_car_id: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface CustomerCommunication {
  id: string;
  customer_id: string;
  type: "WhatsApp" | "Email" | "Phone Call" | "Internal Note";
  subject: string | null;
  summary: string;
  related_car_id: string | null;
  staff_id: string | null;
  created_at: string;
}
