/**
 * @file file-upload.component.tsx
 * @module @stackra/ui/react/components/file-upload
 * @description Drag-and-drop file upload zone with thumbnail preview grid.
 *   Compound component: FileUpload (drop zone) + FileUpload.Preview (thumbnails).
 */

"use client";

import { Button, ProgressBar } from "@heroui/react";
import React, { useCallback, useRef, useState } from "react";

import type { FileUploadProps, FileUploadPreviewProps, UploadFile } from "./file-upload.interface";

// ============================================================================
// Root (Drop Zone)
// ============================================================================

/**
 * FileUpload — Drag-and-drop file upload zone.
 *
 * Provides a visual drop area with file input integration, drag state
 * highlighting, and file type/size validation.
 *
 * @param props - Component props.
 * @returns The file upload drop zone.
 *
 * @example
 * ```tsx
 * const [files, setFiles] = useState<UploadFile[]>([]);
 *
 * <FileUpload
 *   accept={['image/*']}
 *   maxFiles={5}
 *   maxFileSize={5 * 1024 * 1024}
 *   multiple
 *   onFilesAdded={(newFiles) => handleUpload(newFiles)}
 * />
 * <FileUpload.Preview files={files} onRemove={handleRemove} />
 * ```
 */
function FileUploadRoot({
  onFilesAdded,
  accept,
  maxFiles,
  maxFileSize,
  multiple = true,
  isDisabled = false,
  label = "Drop files here or click to upload",
  description,
  className,
  children,
}: FileUploadProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (fileList: File[]): File[] => {
      let valid = fileList;

      if (accept && accept.length > 0) {
        valid = valid.filter((f) =>
          accept.some((pattern) => {
            if (pattern.endsWith("/*")) {
              return f.type.startsWith(pattern.replace("/*", "/"));
            }

            return f.type === pattern;
          }),
        );
      }

      if (maxFileSize) {
        valid = valid.filter((f) => f.size <= maxFileSize);
      }

      if (maxFiles) {
        valid = valid.slice(0, maxFiles);
      }

      return valid;
    },
    [accept, maxFileSize, maxFiles],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || isDisabled) return;
      const validated = validateFiles(Array.from(fileList));

      if (validated.length > 0) {
        onFilesAdded?.(validated);
      }
    },
    [validateFiles, onFilesAdded, isDisabled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!isDisabled) inputRef.current?.click();
  }, [isDisabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFiles],
  );

  const acceptString = accept?.join(",");

  return (
    <div
      aria-label={label}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-default-300 hover:border-default-400 bg-default-50"
      } ${isDisabled ? "pointer-events-none opacity-50" : ""} ${className ?? ""}`.trim()}
      data-component="file-upload"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        accept={acceptString}
        className="hidden"
        disabled={isDisabled}
        multiple={multiple}
        type="file"
        onChange={handleInputChange}
      />

      {children ?? (
        <>
          <div className="bg-default-100 mb-2 rounded-full p-3">
            <svg
              className="text-foreground-400 size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-foreground text-sm font-medium">{label}</p>
          {description && <p className="text-foreground-500 mt-1 text-xs">{description}</p>}
        </>
      )}
    </div>
  );
}

FileUploadRoot.displayName = "FileUpload";

// ============================================================================
// Preview (Thumbnails)
// ============================================================================

/**
 * FileUpload.Preview — Grid of file thumbnails with remove buttons.
 */
const FileUploadPreview = React.memo(function FileUploadPreview({
  files,
  onRemove,
  className,
}: FileUploadPreviewProps): React.ReactElement | null {
  if (files.length === 0) return null;

  return (
    <div
      className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 ${className ?? ""}`.trim()}
      data-component="file-upload-preview"
    >
      {files.map((uploadFile) => (
        <FilePreviewItem key={uploadFile.id} uploadFile={uploadFile} onRemove={onRemove} />
      ))}
    </div>
  );
});

FileUploadPreview.displayName = "FileUpload.Preview";

// ============================================================================
// Preview Item (Internal)
// ============================================================================

/** Internal thumbnail item for a single file. */
const FilePreviewItem = React.memo(function FilePreviewItem({
  uploadFile,
  onRemove,
}: {
  uploadFile: UploadFile;
  onRemove?: (id: string) => void;
}): React.ReactElement {
  const isImage = uploadFile.type.startsWith("image/");
  const handleRemove = useCallback(() => onRemove?.(uploadFile.id), [uploadFile.id, onRemove]);

  return (
    <div className="group border-default-200 bg-default-50 relative overflow-hidden rounded-lg border">
      {/* Thumbnail or file icon */}
      <div className="bg-default-100 flex aspect-square items-center justify-center">
        {isImage && uploadFile.previewUrl ? (
          <img
            alt={uploadFile.name}
            className="size-full object-cover"
            src={uploadFile.previewUrl}
          />
        ) : (
          <svg
            className="text-foreground-300 size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Upload progress */}
      {uploadFile.status === "uploading" && uploadFile.progress != null && (
        <div className="absolute right-0 bottom-0 left-0">
          <ProgressBar
            aria-label={`Uploading ${uploadFile.name}`}
            color="accent"
            size="sm"
            value={uploadFile.progress}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <Button
          isIconOnly
          aria-label={`Remove ${uploadFile.name}`}
          className="bg-background/80 absolute top-1 right-1 size-6 min-w-0 opacity-0 transition-opacity group-hover:opacity-100"
          size="sm"
          variant="ghost"
          onPress={handleRemove}
        >
          <svg
            className="size-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      )}

      {/* File name */}
      <div className="px-2 py-1.5">
        <p className="text-foreground-600 truncate text-xs">{uploadFile.name}</p>
      </div>
    </div>
  );
});

FilePreviewItem.displayName = "FilePreviewItem";

// ============================================================================
// Compound Export
// ============================================================================

export const FileUpload = Object.assign(FileUploadRoot, {
  Preview: FileUploadPreview,
});
