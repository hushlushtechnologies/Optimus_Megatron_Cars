"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { downloadExportFile } from "@/src/lib/utils/download-export-file";
import type { ExportFormat, ExportScope } from "@/src/lib/utils/test-drive-export";

/**
 * "current" exports the whole filtered list (page and page size are ignored).
 * "selected" exports just the ids given. One export runs at a time.
 */
export function useTestDriveExport() {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);
  const busy = useRef(false);

  const run = useCallback(
    async (format: ExportFormat, scope: ExportScope, ids: string[] = []) => {
      if (busy.current) return;
      busy.current = true;
      setIsExporting(true);

      const label = format === "pdf" ? "PDF" : "Excel";
      const toastId = toast.loading(`Preparing your ${label} export…`);

      try {
        const params = new URLSearchParams();
        if (scope === "current") {
          searchParams.forEach((value, key) => params.set(key, value));
          params.delete("page");
          params.delete("pageSize");
        } else {
          const sort = searchParams.get("sort");
          if (sort) params.set("sort", sort);
          if (searchParams.get("archived") === "true") params.set("archived", "true");
          params.set("ids", ids.join(","));
        }
        params.set("format", format);
        params.set("scope", scope);

        const result = await downloadExportFile(`/admin/test-drives/export?${params.toString()}`);

        if (result.error) {
          toast.error(result.error, { id: toastId });
        } else if (result.truncated) {
          toast.warning(
            `Only the first ${result.count ?? "few"} of ${result.total ?? "many"} test drives are in this file. Narrow the filters to export the rest.`,
            { id: toastId, duration: 8000 },
          );
        } else {
          toast.success(`${label} export downloaded`, { id: toastId });
        }
      } catch {
        toast.error("The export couldn't be created. Please try again.", { id: toastId });
      } finally {
        busy.current = false;
        setIsExporting(false);
      }
    },
    [searchParams],
  );

  return { run, isExporting };
}
