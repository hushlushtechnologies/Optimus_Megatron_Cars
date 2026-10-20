"use client";

import { useEffect, useState } from "react";

/**
 * Protects unsaved changes in a dialog. Closing (Cancel, Escape, clicking
 * outside) asks first when something has changed, and closing the browser tab
 * gets the browser's own warning. The question appears inside the dialog, so
 * two dialogs are never open at once.
 */
export function useDiscardGuard(isDirty: boolean, onClose: () => void) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return {
    confirming: confirming && isDirty,
    requestClose: () => {
      if (isDirty) setConfirming(true);
      else onClose();
    },
    keepEditing: () => setConfirming(false),
    discard: onClose,
  };
}
