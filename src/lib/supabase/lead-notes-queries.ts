import { createClient } from "@/src/lib/supabase/client";
import type { LeadNote } from "@/src/lib/types/lead";

const ELEVATED_ROLES = ["Super Admin", "Admin", "Manager"];

export interface LeadNotesResult {
  notes: LeadNote[];
  authorNames: Record<string, string>;
  currentUserId: string | null;
  canManageAllNotes: boolean;
}

export async function getLeadNotesWithAuthors(leadId: string): Promise<LeadNotesResult> {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("lead_notes")
    .select("*")
    .eq("lead_id", leadId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const authorIds = new Set<string>();
  (notes ?? []).forEach((n) => n.created_by && authorIds.add(n.created_by));

  const { data: profiles } = authorIds.size
    ? await supabase.from("profiles").select("id, full_name").in("id", Array.from(authorIds))
    : { data: [] };

  const authorNames: Record<string, string> = {};
  (profiles ?? []).forEach((p) => (authorNames[p.id] = p.full_name ?? "Unknown"));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentProfile } = user
    ? await supabase.from("profiles").select("roles(name)").eq("id", user.id).single()
    : { data: null };

  const currentRoleName = (currentProfile?.roles as unknown as { name: string } | null)?.name;
  const canManageAllNotes = !!currentRoleName && ELEVATED_ROLES.includes(currentRoleName);

  return {
    notes: (notes ?? []) as LeadNote[],
    authorNames,
    currentUserId: user?.id ?? null,
    canManageAllNotes,
  };
}
