"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/src/components/ui/dropdown";
import { IconButton } from "@/src/components/ui/icon-button";
import { Spinner } from "@/src/components/ui/spinner";

interface ExportMenuProps {
  onExportPDF: () => Promise<void>;
  onExportExcel: () => Promise<void>;
}

export function ExportMenu({ onExportPDF, onExportExcel }: ExportMenuProps) {
  const [exportingType, setExportingType] = useState<"pdf" | "excel" | null>(null);

  const handleExport = async (type: "pdf" | "excel") => {
    setExportingType(type);
    try {
      await (type === "pdf" ? onExportPDF() : onExportExcel());
      toast.success(`Exported as ${type === "pdf" ? "PDF" : "Excel"}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to export as ${type === "pdf" ? "PDF" : "Excel"}. Please try again.`,
      );
    } finally {
      setExportingType(null);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <IconButton aria-label="Export options" variant="outline">
          <Download className="size-4" />
        </IconButton>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-48 py-1">
        <button
          type="button"
          role="menuitem"
          disabled={exportingType !== null}
          onClick={() => handleExport("pdf")}
          className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left disabled:opacity-50"
        >
          {exportingType === "pdf" ? (
            <Spinner size="sm" />
          ) : (
            <FileText className="text-text-muted size-4" aria-hidden="true" />
          )}
          Export PDF
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={exportingType !== null}
          onClick={() => handleExport("excel")}
          className="text-body-sm text-text-primary hover:bg-card-hover flex w-full items-center gap-2.5 px-4 py-2 text-left disabled:opacity-50"
        >
          {exportingType === "excel" ? (
            <Spinner size="sm" />
          ) : (
            <FileSpreadsheet className="text-text-muted size-4" aria-hidden="true" />
          )}
          Export Excel
        </button>
      </DropdownContent>
    </Dropdown>
  );
}
