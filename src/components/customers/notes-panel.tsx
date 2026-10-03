"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Trash2, Lock } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import type { CustomerNote } from "@/src/lib/types/customer";

interface NotesPanelProps {
  customerId: string;
  notes: CustomerNote[];
  authorNames: Record<string, string>;
  onAddNote: (customerId: string, text: string) => Promise<{ error: string | null; note?: CustomerNote }>;
  onDeleteNote: (noteId: string) => Promise<{ error: string | null }>;
}

export function NotesPanel({
  customerId,
  notes: initialNotes,
  authorNames,
  onAddNote,
  onDeleteNote,
}: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setIsSaving(true);
    const result = await onAddNote(customerId, draft.trim());
    setIsSaving(false);

    if (result.error || !result.note) {
      toast.error(result.error ?? "Unable to add note. Please try again.");
      return;
    }

    setNotes((prev) => [result.note!, ...prev]);
    setDraft("");
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setPendingDeleteId(null);

    const result = await onDeleteNote(id);
    if (result.error) toast.error(result.error);
    else toast.success("Note removed");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          aria-label="Add a note"
          placeholder="e.g. Customer interested in Lamborghini Urus below AED 900,000."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <Button
          size="sm"
          className="self-end"
          onClick={handleAdd}
          isLoading={isSaving}
          disabled={!draft.trim()}
        >
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-body-sm text-text-muted">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="surface-card flex items-start justify-between gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-body-sm text-text-primary whitespace-pre-wrap">{note.note_text}</p>
                <p className="text-caption text-text-subtle mt-1.5 flex items-center gap-1.5">
                  {note.is_internal && <Lock className="size-3" aria-hidden="true" />}
                  {authorNames[note.created_by ?? ""] ?? "Unknown"} ·{" "}
                  {formatDistanceToNow(new Date(note.created_at), {
                    addSuffix: true,
                  })}
                  {note.updated_at && " · edited"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => setPendingDeleteId(note.id)}
                className="text-text-muted shrink-0 hover:text-red-400"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
