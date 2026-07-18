/**
 * @file file-upload.interface.ts
 * @module @stackra/ui/react/components/file-upload
 * @description Props interfaces for the FileUpload compound component.
 */

import type { ReactNode } from "react";

// ============================================================================
// Types
// ============================================================================

/** Represents a file in the upload queue. */
export interface UploadFile {
  /** Unique identifier for this file instance. */
  id: string;

  /** The browser File object (null for server-uploaded files). */
  file?: File;

  /** File name. */
  name: string;

  /** File size in bytes. */
  size: number;

  /** MIME type. */
  type: string;

  /** Preview URL (object URL for images, or server URL). */
  previewUrl?: string;

  /** Upload progress (0-100). Undefined means not started. */
  progress?: number;

  /** Upload status. */
  status: "idle" | "uploading" | "completed" | "error";

  /** Error message if status is 'error'. */
  error?: string;
}

// ============================================================================
// Component Props
// ============================================================================

/** Props for the root FileUpload component. */
export interface FileUploadProps {
  /** Current list of upload files (controlled). */
  files?: UploadFile[];

  /** Callback when the file list changes. */
  onFilesChange?: (files: UploadFile[]) => void;

  /** Callback when files are selected (dropped or picked). */
  onFilesAdded?: (files: File[]) => void;

  /** Callback when a file is removed from the list. */
  onFileRemove?: (fileId: string) => void;

  /** Accepted MIME types (e.g., ['image/*', 'application/pdf']). */
  accept?: string[];

  /** Maximum number of files allowed. */
  maxFiles?: number;

  /** Maximum file size in bytes. */
  maxFileSize?: number;

  /** Whether multiple file selection is allowed. */
  multiple?: boolean;

  /** Whether the upload is disabled. */
  isDisabled?: boolean;

  /** Custom drop zone label. */
  label?: string;

  /** Custom drop zone description. */
  description?: string;

  /** Additional CSS classes for the container. */
  className?: string;

  /** Optional custom content inside the drop zone. */
  children?: ReactNode;
}

/** Props for the FileUpload.Preview thumbnail grid. */
export interface FileUploadPreviewProps {
  /** Files to display as thumbnails. */
  files: UploadFile[];

  /** Callback when a file's remove button is clicked. */
  onRemove?: (fileId: string) => void;

  /** Additional CSS classes for the preview grid. */
  className?: string;
}
