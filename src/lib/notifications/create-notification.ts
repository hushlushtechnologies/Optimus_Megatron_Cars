import { createAdminClient } from "@/src/lib/supabase/admin";

// Deliberately NOT a "use server" file: every export of a "use server" file
// becomes a callable endpoint, and this one inserts notifications for ANY
// user. It must only ever be imported by other server code.

export interface CreateNotificationInput {
  recipientId: string;
  type: string;
  title: string;
  description?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  dedupeKey?: string | null;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // Nobody needs a notification about something they just did themselves.
  if (input.actorId && input.recipientId === input.actorId) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      recipient_id: input.recipientId,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      actor_id: input.actorId ?? null,
      dedupe_key: input.dedupeKey ?? null,
    });

    // 23505 = the dedupe index caught a duplicate, which is the point of it.
    if (error && error.code !== "23505") {
      console.error("createNotification error:", error);
    }
  } catch (error) {
    // A failed notification must never fail the action that triggered it.
    console.error("createNotification threw:", error);
  }
}
