import { NotesPanel } from "@/src/components/customers/notes-panel";
import { getCustomerNotesWithAuthors } from "@/src/lib/supabase/customer-detail-queries";
import { createNote, updateNote, archiveNote } from "@/app/admin/customers/[id]/notes-actions";

export async function NotesTab({ customerId }: { customerId: string }) {
  const { notes, authorNames, currentUserId, canManageAllNotes } =
    await getCustomerNotesWithAuthors(customerId);

  return (
    <NotesPanel
      customerId={customerId}
      notes={notes}
      authorNames={authorNames}
      currentUserId={currentUserId}
      canManageAllNotes={canManageAllNotes}
      onAddNote={createNote}
      onUpdateNote={updateNote}
      onArchiveNote={archiveNote}
    />
  );
}
