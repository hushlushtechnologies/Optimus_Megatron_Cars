"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";

interface SyncLeadTagsResult {
  error: string | null;
}

export async function syncLeadTags(
  leadId: string,
  currentTagIds: string[],
  newTagIds: string[],
): Promise<SyncLeadTagsResult> {
  try {
    if (!leadId) {
      return {
        error: "Lead ID is required.",
      };
    }

    const supabase = await createClient();

    // Remove duplicate ids just in case.
    const currentIds = [...new Set(currentTagIds)];
    const nextIds = [...new Set(newTagIds)];

    // Tags that need to be added.
    const tagsToAdd = nextIds.filter((tagId) => !currentIds.includes(tagId));

    // Tags that need to be removed.
    const tagsToRemove = currentIds.filter((tagId) => !nextIds.includes(tagId));

    /*
     * REMOVE TAGS
     */
    if (tagsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("lead_tag_assignments")
        .delete()
        .eq("lead_id", leadId)
        .in("tag_id", tagsToRemove);

      if (deleteError) {
        console.error("Failed to remove lead tags:", deleteError);

        return {
          error: deleteError.message,
        };
      }
    }

    /*
     * ADD TAGS
     */
    if (tagsToAdd.length > 0) {
      const rows = tagsToAdd.map((tagId) => ({
        lead_id: leadId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase.from("lead_tag_assignments").upsert(rows, {
        onConflict: "lead_id,tag_id",
        ignoreDuplicates: true,
      });

      if (insertError) {
        console.error("Failed to add lead tags:", insertError);

        return {
          error: insertError.message,
        };
      }
    }

    revalidatePath(`/admin/leads/${leadId}`);

    return {
      error: null,
    };
  } catch (error) {
    console.error("Unexpected error syncing lead tags:", error);

    return {
      error: error instanceof Error ? error.message : "Unable to update lead tags.",
    };
  }
}
