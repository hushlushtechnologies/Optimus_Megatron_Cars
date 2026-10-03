"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

interface MediaDropzoneProps {
  accept: string;
  multiple?: boolean;
  hint: string;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function MediaDropzone({
  accept,
  multiple = true,
  hint,
  onFilesSelected,
  disabled,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    onFilesSelected(Array.from(fileList));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "border-border flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
        isDragOver && "border-primary bg-primary/5",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <UploadCloud className="text-text-subtle size-7" aria-hidden="true" />
      <p className="text-body-sm text-text-primary">
        Drag and drop files here, or{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="text-primary-text hover:text-primary-hover underline"
        >
          browse
        </button>
      </p>
      <p className="text-caption">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        className="sr-only"
      />
    </div>
  );
}
