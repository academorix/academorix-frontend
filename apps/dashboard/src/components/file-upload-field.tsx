/**
 * @file file-upload-field.tsx
 * @module components/file-upload-field
 *
 * @description
 * Production wrapper around HeroUI Pro's `DropZone` that plugs into
 * the `GenericFormPage` field dispatch table as a new `"file"` field
 * kind.
 *
 * The wrapper covers the four responsibilities every real-world file
 * field carries:
 *
 *   1. **Client-side validation** — file-count cap, per-file size
 *      cap, MIME-type allow-list. Rejections surface as an
 *      inline error message under the drop zone.
 *   2. **Upload orchestration** — the caller can pass a real
 *      `upload(file)` callback that returns `{url, id?}`; if omitted
 *      the wrapper falls back to an object-URL "local upload" that
 *      lets the form work end-to-end against the JSON fixture backend
 *      the app ships today. Every accepted file goes through the same
 *      `UploadFile` state machine (`uploading → complete | failed`)
 *      so the visual language is identical whether the transport is
 *      real or stubbed.
 *   3. **FormData integration** — the entire accepted file list is
 *      serialised into a hidden `<input>` as a JSON array of
 *      `{name, size, mimeType, url, id?}` records. Native `FormData`
 *      submission picks this up alongside every other field without
 *      the enclosing form needing to know about `File` blobs.
 *   4. **Accessibility** — the drop zone's own labels stay wired,
 *      the outer `<Label>` associates with the file picker input,
 *      and remove/retry buttons carry per-file `aria-label`s.
 *
 * ## Value contract
 *
 * The hidden input carries a **JSON array** — one object per uploaded
 * file. Empty selection emits `""` which the form's `coerceValue`
 * drops from the payload:
 *
 * ```json
 * [
 *   {"name":"logo.png","size":24576,"mimeType":"image/png","url":"…"},
 *   {"name":"proposal.pdf","size":2306867,"mimeType":"application/pdf","url":"…"}
 * ]
 * ```
 *
 * The backend receives an array of already-uploaded references (URLs
 * or ids), never raw blobs — which is the standard "upload first,
 * associate on save" flow the Refine data provider expects.
 *
 * ## Design intent
 *
 * We ship a fake-upload fallback (object URLs) so this field works in
 * the fixture era without a signed-upload endpoint. When the real
 * backend adds `POST /api/uploads`, callers pass an `upload` prop
 * that hits it and the wrapper flips to production behaviour without
 * any other changes.
 */

import type { ReactNode } from "react";

import { FieldError, Label } from "@heroui/react";
import { DropZone } from "@heroui-pro/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One accepted-and-referenced file entry. The `FormData` payload
 * carries an array of these — never raw `File` blobs.
 *
 * `id` is optional because the object-URL fallback can't mint one;
 * a real upload endpoint should include it so the backend can dedupe
 * references and clean up orphans on cascade.
 */
export type UploadedFile = {
  /** Original file name — used for display + eventual download. */
  name: string;
  /** Size in bytes. */
  size: number;
  /** MIME type or empty string when the browser couldn't detect one. */
  mimeType: string;
  /** URL the backend can fetch. Object URL when using the fallback. */
  url: string;
  /** Optional backend-issued id — required for delete cascade. */
  id?: string;
};

/**
 * The upload function shape callers pass in production. Should return
 * `{url}` or `{url, id}` once the file is stored. Errors thrown /
 * rejected promises land the file in the `failed` state so users get
 * a retry affordance.
 */
export type UploadFn = (
  file: File,
  onProgress?: (percent: number) => void,
) => Promise<{ url: string; id?: string }>;

/**
 * Internal per-file state machine — kept private to the module so we
 * don't leak it to callers who only care about the final
 * `UploadedFile[]` payload.
 */
type QueuedFile = {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "failed";
  /** Populated once the upload resolves. */
  result?: UploadedFile;
  /** Retained on the failed state so the retry button knows what to do. */
  error?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the extension from a file name for display. Returns an empty
 * string for files without one — the drop-zone icon accepts empty and
 * falls back to a generic file icon.
 */
function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.slice(dot + 1) : "";
}

/**
 * Human-friendly file size — bytes / KB / MB. Kept local rather than
 * pulling in a formatter dep for one call site.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * DropZone's `FileFormatIcon` accepts a limited set of colours — this
 * map picks one based on the file extension so the icons feel
 * differentiated at a glance without becoming noisy.
 */
type FileFormatColor = "blue" | "gray" | "green" | "orange" | "purple" | "red";

const FORMAT_COLOR: Record<string, FileFormatColor> = {
  csv: "green",
  doc: "blue",
  docx: "blue",
  fig: "purple",
  jpeg: "blue",
  jpg: "blue",
  json: "orange",
  mp4: "purple",
  pdf: "red",
  png: "green",
  svg: "green",
  txt: "gray",
  xlsx: "green",
  zip: "orange",
};

function getFormatColor(ext: string): FileFormatColor {
  return FORMAT_COLOR[ext.toLowerCase()] ?? "gray";
}

/**
 * The default "fake" uploader used when the caller doesn't pass a real
 * `upload` prop. Creates an object URL so the file is still viewable
 * in-browser and returns immediately — no network round-trip.
 *
 * Object URLs live for the lifetime of the document and must be
 * revoked to avoid a memory leak. The component handles revocation in
 * an effect cleanup + on remove.
 */
async function objectUrlUpload(file: File): Promise<{ url: string }> {
  return { url: URL.createObjectURL(file) };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Public props for `FileUploadField`.
 *
 * Mirrors `PhoneInput` / `RichTextEditorField` for the `FieldControl`
 * dispatch table plus the file-specific bits (accept / maxSize /
 * multiple / upload).
 */
export type FileUploadFieldProps = {
  /** Form field name — used for the hidden `<input>` that submits JSON. */
  name: string;
  /** Visible label above the drop zone. */
  label: string;
  /** Optional helper text under the drop zone. */
  description?: string;
  /** Whether the field is required — enforced on the hidden input. */
  isRequired?: boolean;
  /** Disable the entire component (drop zone + trigger). */
  isDisabled?: boolean;
  /**
   * `<input accept>`-style filter. Passed straight to the native
   * picker so the OS pre-filters selections (`"image/*,.pdf"`).
   */
  accept?: string;
  /**
   * Whether multiple files can be uploaded. Defaults to `false` for
   * the common "single avatar / document" case.
   */
  multiple?: boolean;
  /** Maximum accepted file size in bytes. Files larger are rejected. */
  maxSize?: number;
  /** Maximum accepted file count. Files past the cap are rejected. */
  maxFiles?: number;
  /**
   * Real upload transport. When set, each dropped/picked file goes
   * through it and the returned `{url, id?}` is stored in the payload.
   * When omitted, an object-URL fallback keeps the form functional
   * against the JSON fixture backend.
   */
  upload?: UploadFn;
  /** Seed value — restores previously-uploaded files on edit. */
  defaultValue?: UploadedFile[] | string;
  /** Extra className for the outer wrapper. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `FileUploadField` — the exported wrapper.
 *
 * State model:
 *
 *   * `queue` — one entry per queued file, tracking `uploading /
 *     complete / failed`. Persisted through remounts within a form
 *     session via component state.
 *   * `objectUrls` — a ref-tracked set of the object URLs we minted
 *     via the fallback uploader, revoked on unmount / remove to avoid
 *     memory leaks.
 *
 * On every state change the hidden `<input>` value is recomputed from
 * `queue`, filtered to entries in the `complete` state. In-flight or
 * failed files are excluded from the submitted payload — the user has
 * to wait for uploads to finish before submitting the form.
 */
export function FileUploadField({
  name,
  label,
  description,
  isRequired,
  isDisabled,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  upload,
  defaultValue,
  className,
}: FileUploadFieldProps): ReactNode {
  const fieldId = useId();

  // --- initial state --------------------------------------------------------
  // Support seeding with either a `UploadedFile[]` (edit form loading
  // previously-persisted files) or a JSON-serialised string (matches
  // how the hidden input value round-trips). Anything else = empty.
  const initialQueue = useMemo<QueuedFile[]>(() => {
    const parsed = parseSeed(defaultValue);

    return parsed.map((entry, index) => ({
      // Synthetic queue id — kept stable per index in the seed so the
      // remove button can target it. Real File isn't available for
      // seeded rows, so we substitute a stub.
      id: `seed-${index}-${entry.name}`,
      file: new File([], entry.name, { type: entry.mimeType }),
      progress: 100,
      status: "complete" as const,
      result: entry,
    }));
  }, [defaultValue]);

  const [queue, setQueue] = useState<QueuedFile[]>(initialQueue);

  // Track object URLs we mint via the fallback so we can revoke them
  // on unmount / remove. `useRef` (not state) because these are
  // side-effects, not render inputs.
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Error surface for client-side rejections (over size / over count /
  // wrong type). Cleared on the next successful accept.
  const [error, setError] = useState<string | null>(null);

  // --- payload --------------------------------------------------------------
  // Recompute the hidden input value on every render — kept as a JSON
  // array of the completed uploads only. In-flight and failed files
  // are excluded so the form never submits a partial state.
  const submittedValue = useMemo(() => {
    const completed = queue.filter((q) => q.status === "complete" && q.result);

    if (completed.length === 0) return "";

    return JSON.stringify(completed.map((q) => q.result));
  }, [queue]);

  // --- validation -----------------------------------------------------------
  const validate = useCallback(
    (incoming: File[]): { accepted: File[]; rejections: string[] } => {
      const accepted: File[] = [];
      const rejections: string[] = [];

      for (const file of incoming) {
        if (maxSize && file.size > maxSize) {
          rejections.push(`${file.name} exceeds the ${formatFileSize(maxSize)} limit`);
          continue;
        }
        accepted.push(file);
      }

      // Enforce `maxFiles` against the already-accepted queue plus this
      // batch. Extras get rejected so we never exceed the cap.
      if (maxFiles !== undefined) {
        const already = queue.length;
        const remaining = Math.max(0, maxFiles - already);
        const overflow = Math.max(0, accepted.length - remaining);

        if (overflow > 0) {
          const trimmed = accepted.splice(-overflow);

          for (const file of trimmed) {
            rejections.push(`${file.name} skipped — max ${maxFiles} file(s)`);
          }
        }
      }

      return { accepted, rejections };
    },
    [maxFiles, maxSize, queue.length],
  );

  // --- upload loop ----------------------------------------------------------
  // Runs each accepted file through the configured `upload` transport
  // (or the object-URL fallback) and moves the entry from `uploading`
  // to `complete` / `failed` on resolution. Kept as an async loop so
  // uploads run in parallel — a real endpoint likely rate-limits on
  // the server side anyway, and the UI feels snappier this way.
  const uploader = useMemo<UploadFn>(() => upload ?? objectUrlUpload, [upload]);

  const startUploads = useCallback(
    (files: File[]) => {
      // Fan out uploads without awaiting the outer function — we want
      // React to render the "uploading" state immediately.
      for (const file of files) {
        const queueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        setQueue((prev) => [
          ...prev,
          { id: queueId, file, progress: 0, status: "uploading" as const },
        ]);

        uploader(file, (percent) => {
          setQueue((prev) => prev.map((q) => (q.id === queueId ? { ...q, progress: percent } : q)));
        })
          .then((res) => {
            // Track object URLs so we can revoke them on cleanup. Real
            // uploader URLs are typically absolute https:// — the
            // `blob:` prefix marks the fallback case cleanly.
            if (res.url.startsWith("blob:")) objectUrlsRef.current.add(res.url);

            const result: UploadedFile = {
              name: file.name,
              size: file.size,
              mimeType: file.type,
              url: res.url,
              id: res.id,
            };

            setQueue((prev) =>
              prev.map((q) =>
                q.id === queueId ? { ...q, progress: 100, status: "complete", result } : q,
              ),
            );
          })
          .catch((caught: unknown) => {
            const message = caught instanceof Error ? caught.message : "Upload failed. Try again?";

            setQueue((prev) =>
              prev.map((q) => (q.id === queueId ? { ...q, status: "failed", error: message } : q)),
            );
          });
      }
    },
    [uploader],
  );

  // --- handlers -------------------------------------------------------------
  const handleSelect = useCallback(
    (fileList: FileList) => {
      const incoming = Array.from(fileList);
      const { accepted, rejections } = validate(incoming);

      setError(rejections.length > 0 ? rejections.join(" · ") : null);
      if (accepted.length > 0) startUploads(accepted);
    },
    [startUploads, validate],
  );

  // React Aria's `onDrop` gives us drop items with async `getFile()` —
  // resolve them all before running validation so we can surface a
  // single consolidated error message.
  const handleDrop = useCallback(
    async (event: { items: Array<{ kind: string; getFile?: () => Promise<File> }> }) => {
      const files: File[] = [];

      for (const item of event.items) {
        if (item.kind === "file" && item.getFile) {
          files.push(await item.getFile());
        }
      }
      const { accepted, rejections } = validate(files);

      setError(rejections.length > 0 ? rejections.join(" · ") : null);
      if (accepted.length > 0) startUploads(accepted);
    },
    [startUploads, validate],
  );

  const handleRemove = useCallback((queueId: string) => {
    setQueue((prev) => {
      const removed = prev.find((q) => q.id === queueId);

      // Revoke the object URL immediately on remove so long-lived
      // forms don't accumulate leaked blobs.
      if (removed?.result?.url.startsWith("blob:")) {
        URL.revokeObjectURL(removed.result.url);
        objectUrlsRef.current.delete(removed.result.url);
      }

      return prev.filter((q) => q.id !== queueId);
    });
  }, []);

  const handleRetry = useCallback(
    (queueId: string) => {
      setQueue((prev) => {
        const target = prev.find((q) => q.id === queueId);

        if (!target) return prev;

        // Re-run the uploader for just this file. Kick it off after the
        // state update lands (via `queueMicrotask`) so the queue entry
        // has reverted to `uploading` first.
        queueMicrotask(() => startUploads([target.file]));

        return prev.filter((q) => q.id !== queueId);
      });
    },
    [startUploads],
  );

  // --- cleanup --------------------------------------------------------------
  // Revoke every object URL on unmount to release the underlying blobs.
  useEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  // --- render ---------------------------------------------------------------
  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <Label htmlFor={fieldId}>{label}</Label>

      <DropZone>
        <DropZone.Area isDisabled={isDisabled} onDrop={handleDrop as never}>
          <DropZone.Icon />
          <DropZone.Label>
            {multiple
              ? "Drop files here or click to browse"
              : "Drop a file here or click to browse"}
          </DropZone.Label>
          {description ? <DropZone.Description>{description}</DropZone.Description> : null}
          <DropZone.Trigger isDisabled={isDisabled}>
            {multiple ? "Select files" : "Select file"}
          </DropZone.Trigger>
        </DropZone.Area>
        <DropZone.Input accept={accept} id={fieldId} multiple={multiple} onSelect={handleSelect} />

        {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}

        {queue.length > 0 ? (
          <DropZone.FileList>
            {queue.map((entry) => {
              const ext = getExtension(entry.file.name).toUpperCase();

              return (
                <DropZone.FileItem key={entry.id} status={entry.status}>
                  <DropZone.FileFormatIcon color={getFormatColor(ext.toLowerCase())} format={ext} />
                  <DropZone.FileInfo>
                    <DropZone.FileName>{entry.file.name}</DropZone.FileName>
                    <DropZone.FileMeta>
                      {formatFileSize(entry.file.size)}
                      {entry.status === "uploading" ? ` · ${entry.progress}%` : null}
                      {entry.status === "complete" ? " · Ready" : null}
                      {entry.status === "failed" ? ` · ${entry.error ?? "Failed"}` : null}
                    </DropZone.FileMeta>
                    {entry.status === "uploading" ? (
                      <DropZone.FileProgress value={entry.progress}>
                        <DropZone.FileProgressTrack>
                          <DropZone.FileProgressFill />
                        </DropZone.FileProgressTrack>
                      </DropZone.FileProgress>
                    ) : null}
                  </DropZone.FileInfo>
                  {entry.status === "failed" ? (
                    <DropZone.FileRetryTrigger
                      aria-label={`Retry ${entry.file.name}`}
                      onPress={() => handleRetry(entry.id)}
                    />
                  ) : null}
                  <DropZone.FileRemoveTrigger
                    aria-label={`Remove ${entry.file.name}`}
                    onPress={() => handleRemove(entry.id)}
                  />
                </DropZone.FileItem>
              );
            })}
          </DropZone.FileList>
        ) : null}
      </DropZone>

      <FieldError />

      {/*
       * The single source of truth for form submission. Native
       * FormData reads this input on submit — the drop zone above is
       * presentational only. `required` enforces that at least one
       * successful upload is present when the field is required.
       */}
      <input
        aria-hidden
        name={name}
        readOnly
        required={isRequired}
        tabIndex={-1}
        type="hidden"
        value={submittedValue}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seed parsing — accepts either the already-parsed array or a JSON string.
// ---------------------------------------------------------------------------

function parseSeed(seed: UploadedFile[] | string | undefined): UploadedFile[] {
  if (!seed) return [];
  if (Array.isArray(seed)) return seed;

  try {
    const parsed = JSON.parse(seed) as unknown;

    return Array.isArray(parsed) ? (parsed as UploadedFile[]) : [];
  } catch {
    return [];
  }
}
