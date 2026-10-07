"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/src/lib/supabase/server";
import { assertCanManageCustomers } from "@/src/lib/supabase/customer-permissions";

interface LeadTagActionResult {
  error: string | null;
}

function revalidateLeadPaths(leadId: string) {
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

/**
 * Add one tag to a lead.
 */
export async function addLeadTag(leadId: string, tagId: string): Promise<LeadTagActionResult> {
  try {
    const permission = await assertCanManageCustomers();

    if (!permission.allowed) {
      return {
        error: permission.error,
      };
    }

    if (!leadId) {
      return {
        error: "Lead ID is required.",
      };
    }

    if (!tagId) {
      return {
        error: "Tag ID is required.",
      };
    }

    const supabase = await createClient();

    /**
     * Check whether the relationship already exists.
     *
     * This avoids duplicate rows even if the database
     * constraint has not been configured yet.
     */
    const { data: existingLink, error: lookupError } = await supabase
      .from("lead_tag_links")
      .select("lead_id, tag_id")
      .eq("lead_id", leadId)
      .eq("tag_id", tagId)
      .maybeSingle();

    if (lookupError) {
      console.error("addLeadTag lookup error:", lookupError);

      return {
        error: "Unable to check the current lead tags.",
      };
    }

    if (existingLink) {
      return {
        error: null,
      };
    }

    const { error: insertError } = await supabase.from("lead_tag_links").insert({
      lead_id: leadId,
      tag_id: tagId,
    });

    if (insertError) {
      console.error("addLeadTag insert error:", insertError);

      return {
        error: "Unable to add the tag to this lead.",
      };
    }

    /**
     * Resolve tag name for activity history.
     */
    const { data: tag } = await supabase.from("lead_tags").select("name").eq("id", tagId).maybeSingle();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "tag_added",
      description: tag?.name ? `Tag added: ${tag.name}` : "Tag added",
      new_value: tag?.name ?? tagId,
      changed_by: user?.id ?? null,
    });

    if (activityError) {
      console.error("addLeadTag activity error:", activityError);
    }

    revalidateLeadPaths(leadId);

    return {
      error: null,
    };
  } catch (error) {
    console.error("Unexpected addLeadTag error:", error);

    return {
      error: error instanceof Error ? error.message : "Unable to add the tag.",
    };
  }
}

/**
 * Remove one tag from a lead.
 */
export async function removeLeadTag(leadId: string, tagId: string): Promise<LeadTagActionResult> {
  try {
    const permission = await assertCanManageCustomers();

    if (!permission.allowed) {
      return {
        error: permission.error,
      };
    }

    if (!leadId) {
      return {
        error: "Lead ID is required.",
      };
    }

    if (!tagId) {
      return {
        error: "Tag ID is required.",
      };
    }

    const supabase = await createClient();

    /**
     * Resolve tag name before deleting the relationship.
     */
    const { data: tag } = await supabase.from("lead_tags").select("name").eq("id", tagId).maybeSingle();

    const { error: deleteError } = await supabase
      .from("lead_tag_links")
      .delete()
      .eq("lead_id", leadId)
      .eq("tag_id", tagId);

    if (deleteError) {
      console.error("removeLeadTag error:", deleteError);

      return {
        error: "Unable to remove the tag from this lead.",
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: activityError } = await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "tag_removed",
      description: tag?.name ? `Tag removed: ${tag.name}` : "Tag removed",
      old_value: tag?.name ?? tagId,
      changed_by: user?.id ?? null,
    });

    if (activityError) {
      console.error("removeLeadTag activity error:", activityError);
    }

    revalidateLeadPaths(leadId);

    return {
      error: null,
    };
  } catch (error) {
    console.error("Unexpected removeLeadTag error:", error);

    return {
      error: error instanceof Error ? error.message : "Unable to remove the tag.",
    };
  }
}

/**
 * Synchronize the complete tag selection for one lead.
 *
 * currentTagIds:
 * tags currently attached to the lead
 *
 * newTagIds:
 * tags selected by the user in the dialog
 */
export async function syncLeadTags(
  leadId: string,
  currentTagIds: string[],
  newTagIds: string[],
): Promise<LeadTagActionResult> {
  try {
    const permission = await assertCanManageCustomers();

    if (!permission.allowed) {
      return {
        error: permission.error,
      };
    }

    if (!leadId) {
      return {
        error: "Lead ID is required.",
      };
    }

    const currentIds = [...new Set(currentTagIds)];

    const nextIds = [...new Set(newTagIds)];

    const tagsToAdd = nextIds.filter((tagId) => !currentIds.includes(tagId));

    const tagsToRemove = currentIds.filter((tagId) => !nextIds.includes(tagId));

    /**
     * Use the single-tag actions so:
     *
     * - permissions remain consistent
     * - activities are logged
     * - revalidation remains consistent
     * - bulk actions can reuse the same functions
     */
    for (const tagId of tagsToRemove) {
      const result = await removeLeadTag(leadId, tagId);

      if (result.error) {
        return result;
      }
    }

    for (const tagId of tagsToAdd) {
      const result = await addLeadTag(leadId, tagId);

      if (result.error) {
        return result;
      }
    }

    revalidateLeadPaths(leadId);

    return {
      error: null,
    };
  } catch (error) {
    console.error("Unexpected syncLeadTags error:", error);

    return {
      error: error instanceof Error ? error.message : "Unable to update lead tags.",
    };
  }
}
