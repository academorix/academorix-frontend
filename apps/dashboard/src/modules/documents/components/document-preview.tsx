/**
 * @file document-preview.tsx
 * @module modules/documents/components/document-preview
 *
 * @description
 * A best-effort preview panel for a stored document. Images render inside
 * an `<img>`, PDFs inside a sandboxed `<iframe>`, everything else falls
 * back to a friendly "no preview" card. The panel intentionally does not
 * fetch the file itself — the caller passes the (already resolved) URL,
 * so the same component composes over both signed-url downloads and
 * local `URL.createObjectURL` blobs used by the upload flow.
 */

import { DocumentTextIcon } from "@academorix/ui/icons/outline";
import { EmptyState } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { iconForDocumentType, labelForDocumentType } from "@/modules/documents/documents.config";

/** Props for {@link DocumentPreview}. */
export interface DocumentPreviewProps {
  /** IANA media type, e.g. `"application/pdf"` or `"image/jpeg"`. */
  mime: string;
  /**
   * URL to render the preview against. May be `null` when the storage
   * signed-url endpoint has not yet responded — the panel shows a
   * placeholder in that case.
   */
  url: string | null;
  /** Original filename, used for `<img>` alt text and the fallback card. */
  filename: string;
  /**
   * Document type key. Drives the fallback icon so a `.docx` still shows
   * the contract glyph even though it has no in-browser preview.
   */
  type: string;
  /** Extra classes forwarded to the outer preview frame. */
  className?: string;
}

/** Whether the MIME type is a browser-native image format. */
function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

/** Whether the MIME type renders inside an iframe as a PDF. */
function isPdfMime(mime: string): boolean {
  return mime === "application/pdf";
}

/**
 * A document preview panel. Height fills its container so the caller can
 * lay it out inside a Card body without extra work; the aspect ratio is
 * generous enough for portrait PDFs while still fitting a landscape image.
 *
 * @param props - MIME, url, filename, type, and optional class overrides.
 */
export function DocumentPreview({
  mime,
  url,
  filename,
  type,
  className,
}: DocumentPreviewProps): ReactNode {
  const Icon = iconForDocumentType(type);
  const outerClass = [
    "flex min-h-64 w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-surface",
    className ?? "",
  ]
    .join(" ")
    .trim();

  // No URL yet — likely a signed-url fetch in flight or a permission
  // block on infected/quarantined uploads.
  if (!url) {
    return (
      <div className={outerClass}>
        <EmptyState size="sm">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Icon aria-hidden="true" />
            </EmptyState.Media>
            <EmptyState.Title>Preview unavailable</EmptyState.Title>
            <EmptyState.Description>
              The preview link has not been generated yet.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </div>
    );
  }

  if (isImageMime(mime)) {
    return (
      <div className={outerClass}>
        <img alt={filename} className="max-h-[70vh] w-auto object-contain" src={url} />
      </div>
    );
  }

  if (isPdfMime(mime)) {
    // The sandbox blocks scripts and popups but keeps navigation inside
    // the frame so table-of-contents jumps still work.
    return (
      <div className={outerClass}>
        <iframe
          className="min-h-[70vh] w-full"
          sandbox="allow-same-origin allow-forms allow-scripts"
          src={url}
          title={`Preview of ${filename}`}
        />
      </div>
    );
  }

  // Anything else (docx, xlsx, arbitrary tenant uploads) — surface the
  // classification icon + filename so the user can still recognise the
  // file, then offer the download button (rendered by the caller).
  return (
    <div className={outerClass}>
      <EmptyState size="sm">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <DocumentTextIcon aria-hidden="true" />
          </EmptyState.Media>
          <EmptyState.Title>No inline preview</EmptyState.Title>
          <EmptyState.Description>
            {labelForDocumentType(type)} — {filename}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  );
}
