import { getLeadNotesWithAuthors } from "@/src/lib/supabase/lead-notes-queries";
import { LeadNotesPanel } from "@/src/components/leads/lead-notes-panel";

export async function NotesTab({ leadId }: { leadId: string }) {
  const { notes, authorNames, currentUserId, canManageAllNotes } = await getLeadNotesWithAuthors(leadId);

  return (
    <LeadNotesPanel
      leadId={leadId}
      notes={notes}
      authorNames={authorNames}
      currentUserId={currentUserId}
      canManageAllNotes={canManageAllNotes}
    />
  );
}
