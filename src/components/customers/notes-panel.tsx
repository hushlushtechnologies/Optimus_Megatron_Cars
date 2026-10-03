"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Trash2, Lock, Pencil, Check, X } from "lucide-react";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";
import type { CustomerNote } from "@/src/lib/types/customer";

interface NotesPanelProps {
  customerId: string;
  notes: CustomerNote[];
  authorNames: Record<string, string>;
  currentUserId: string | null;
  canManageAllNotes: boolean;
  onAddNote: (
    customerId: string,
    text: string,
    isInternal: boolean,
  ) => Promise<{ error: string | null; note?: CustomerNote }>;
  onUpdateNote: (noteId: string, customerId: string, text: string) => Promise<{ error: string | null }>;
  onArchiveNote: (noteId: string, customerId: string) => Promise<{ error: string | null }>;
}

export function NotesPanel({
  customerId,
  notes: initialNotes,
  authorNames,
  currentUserId,
  canManageAllNotes,
  onAddNote,
  onUpdateNote,
  onArchiveNote,
}: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [draftIsInternal, setDraftIsInternal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const canModify = (note: CustomerNote) => canManageAllNotes || note.created_by === currentUserId;

  const handleAdd = async () => {
    if (!draft.trim()) return;
    setIsSaving(true);
    const result = await onAddNote(customerId, draft.trim(), draftIsInternal);
    setIsSaving(false);

    if (result.error || !result.note) {
      toast.error(result.error ?? "Unable to add note. Please try again.");
      return;
    }

    setNotes((prev) => [result.note!, ...prev]);
    setDraft("");
    setDraftIsInternal(true);
  };

  const startEdit = (note: CustomerNote) => {
    setEditingId(note.id);
    setEditText(note.note_text);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim() || isSavingEdit) {
      return;
    }

    setIsSavingEdit(true);

    try {
      const text = editText.trim();

      const result = await onUpdateNote(editingId, customerId, text);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingId
            ? {
                ...note,
                note_text: text,
                updated_at: new Date().toISOString(),
              }
            : note,
        ),
      );

      setEditingId(null);
      setEditText("");

      toast.success("Note updated");
    } catch (error) {
      console.error("Unable to update customer note:", error);

      toast.error("Unable to update note. Please try again.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleArchive = async () => {
    if (!pendingArchiveId) return;
    const id = pendingArchiveId;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setPendingArchiveId(null);

    const result = await onArchiveNote(id, customerId);
    if (result.error) toast.error(result.error);
    else toast.success("Note archived");
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
        <div className="flex items-center justify-between">
          <Switch label="Internal Only" checked={draftIsInternal} onCheckedChange={setDraftIsInternal} />
          <Button size="sm" onClick={handleAdd} isLoading={isSaving} disabled={!draft.trim()}>
            Add Note
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-body-sm text-text-muted">No notes yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => {
            const isEditing = editingId === note.id;
            const editable = canModify(note);

            return (
              <li key={note.id} className="surface-card p-3">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      aria-label="Edit note"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <IconButton
                        aria-label="Cancel edit"
                        variant="ghost"
                        size="sm"
                        disabled={isSavingEdit}
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                      >
                        <X className="size-4" />
                      </IconButton>

                      <IconButton
                        aria-label="Save edit"
                        variant="ghost"
                        size="sm"
                        isLoading={isSavingEdit}
                        disabled={!editText.trim()}
                        onClick={handleSaveEdit}
                      >
                        <Check className="size-4 text-emerald-400" />
                      </IconButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm text-text-primary whitespace-pre-wrap">{note.note_text}</p>
                      <p className="text-caption text-text-subtle mt-1.5 flex flex-wrap items-center gap-1.5">
                        {note.is_internal && <Lock className="size-3" aria-hidden="true" />}
                        {authorNames[note.created_by ?? ""] ?? "Unknown"} ·{" "}
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        {note.updated_at &&
                          ` · edited ${formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}`}
                      </p>
                    </div>
                    {editable && (
                      <div className="flex shrink-0 gap-1">
                        <IconButton
                          aria-label="Edit note"
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(note)}
                        >
                          <Pencil className="size-3.5" />
                        </IconButton>
                        <IconButton
                          aria-label="Archive note"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingArchiveId(note.id)}
                        >
                          <Trash2 className="text-text-muted size-3.5 hover:text-red-400" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={!!pendingArchiveId}
        onClose={() => setPendingArchiveId(null)}
        onConfirm={handleArchive}
        title="Archive this note?"
        description="The note will be hidden from the list but not permanently deleted."
        confirmLabel="Archive"
      />
    </div>
  );
}
