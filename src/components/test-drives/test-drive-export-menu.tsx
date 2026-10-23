"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/src/components/ui/dropdown";
import { Button } from "@/src/components/ui/button";
import { useTestDriveExport } from "@/src/components/test-drives/use-test-drive-export";

interface TestDriveExportMenuProps {
  /** Nothing to export (for example, no results). */
  disabled?: boolean;
}

export function TestDriveExportMenu({ disabled = false }: TestDriveExportMenuProps) {
  const exporter = useTestDriveExport();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="size-3.5" aria-hidden="true" />}
          disabled={disabled || exporter.isExporting}
          className="h-11 shrink-0 rounded-lg px-3 text-xs font-medium sm:h-10"
        >
          Export
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-64 py-1">
        <p className="text-caption text-text-subtle px-4 pt-1.5 pb-1">
          Exports every test drive matching your search and filters, not just this page.
        </p>
        <button
          type="button"
          role="menuitem"
          onClick={() => void exporter.run("excel", "current")}
          className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-3 text-left"
        >
          <FileSpreadsheet className="text-success size-4" aria-hidden="true" />
          Download Excel
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => void exporter.run("pdf", "current")}
          className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-3 text-left"
        >
          <FileText className="text-danger size-4" aria-hidden="true" />
          Download PDF
        </button>
      </DropdownContent>
    </Dropdown>
  );
}
