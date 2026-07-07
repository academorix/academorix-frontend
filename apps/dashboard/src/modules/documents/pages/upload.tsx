/**
 * @file upload.tsx
 * @module modules/documents/pages/upload
 *
 * @description
 * Multi-file drag-and-drop upload for documents. Uses the shared
 * {@link FileUpload} dropzone from `@academorix/ui/react`, which already
 * ships drag state highlighting, file type/size validation, and a preview
 * grid. Each queued file tracks its own progress; the "Upload" action
 * kicks off a simulated progress tick for now because the backend
 * accept-uploads endpoint is not yet wired — see the
 * `TODO(backend-endpoint)` inside {@link performUpload}.
 */

import { CheckCircleIcon, ExclamationTriangleIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Card,
  FileUpload,
  Label,
  ListBox,
  ProgressBar,
  Select,
} from "@academorix/ui/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import type { DocumentOwnerType, DocumentUploadItem } from "@/modules/documents/documents.types";
import type { Key, ReactNode } from "react";

import { CreateView } from "@/components/refine";
import {
  DOCUMENT_ACCEPTED_MIME_TYPES,
  DOCUMENT_MAX_UPLOAD_SIZE_BYTES,
  DOCUMENT_SCOPE_LABELS,
  DOCUMENT_TYPE_LABELS,
  formatByteSize,
} from "@/modules/documents/documents.config";

/**
 * Generates a stable id for a queued upload item. Uses `crypto.randomUUID`
 * when available (browsers, jsdom in recent versions) and a
 * counter-based fallback otherwise, so tests without WebCrypto still work.
 */
function makeUploadItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for older test envs — pair the timestamp with a random suffix
  // to keep the collision rate practically zero.
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Simulates the network side of a single upload — advances progress from
 * 0 to 100 in fixed ticks. Kept as an exported function so tests can
 * observe the state transitions independently of the wall clock.
 *
 * TODO(backend-endpoint): replace with a real `POST /api/v1/documents`
 * that reports progress via `XMLHttpRequest.upload.onprogress` or a
 * fetch stream. The state machine here (`uploading → completed`) is the
 * same contract, so only the transport swap matters.
 *
 * @param onTick - Called with each progress update (0..100).
 * @returns Promise resolving when the mock upload hits 100.
 */
export function simulateUploadProgress(onTick: (pct: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let value = 0;

    const tick = (): void => {
      value = Math.min(100, value + 25);
      onTick(value);

      if (value >= 100) {
        resolve();

        return;
      }

      setTimeout(tick, 50);
    };

    tick();
  });
}

/**
 * The upload page. Files are staged in local state; the "Upload" action
 * marches each queued item through `uploading → completed` (or `error`).
 * The active scope + document type are collected once and applied to
 * every file in the batch so the operator does not repeat themselves.
 */
export default function DocumentsUpload(): ReactNode {
  const navigate = useNavigate();
  const [items, setItems] = useState<DocumentUploadItem[]>([]);
  const [scope, setScope] = useState<DocumentOwnerType | "">("");
  const [type, setType] = useState<string>("");
  const [batchError, setBatchError] = useState<string | null>(null);
  // Track the in-flight upload so the "Upload" button stays disabled until
  // the batch finishes, without needing a per-item pending flag.
  const isBusyRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);

  const totalBytes = useMemo(
    () => items.reduce((sum, item) => sum + item.file.size, 0),
    [items],
  );

  /**
   * Handles files added via the shared FileUpload dropzone (already
   * validated for accept + size). We add them to local state as `idle`,
   * then wait for the operator to press "Upload".
   */
  const handleFilesAdded = useCallback((files: File[]) => {
    setBatchError(null);
    setItems((current) => [
      ...current,
      ...files.map<DocumentUploadItem>((file) => ({
        id: makeUploadItemId(),
        file,
        status: "idle",
        progress: undefined,
      })),
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  /**
   * Kicks off the (currently simulated) upload for every queued item.
   * Runs sequentially so per-file progress bars advance one at a time —
   * matches how a real chunked-upload endpoint would gate concurrency to
   * respect any per-tenant rate limits.
   */
  const performUpload = useCallback(async () => {
    if (isBusyRef.current) {
      return;
    }

    if (!scope || !type) {
      setBatchError("Pick a scope and a document type before uploading.");

      return;
    }

    isBusyRef.current = true;
    setIsBusy(true);
    setBatchError(null);

    // Snapshot the ids we own now so a later `removeItem` doesn't leave
    // us marching over a stale list. New items dropped mid-batch stay
    // queued for the next Upload press.
    const queued = items.filter((item) => item.status === "idle");

    for (const item of queued) {
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "uploading" as const, progress: 0 }
            : entry,
        ),
      );

      // TODO(backend-endpoint): POST the file to `/api/v1/documents`
      // here. The request body will need the scope + type collected
      // above; the response should carry the created DocumentData row.
      await simulateUploadProgress((progress) => {
        setItems((current) =>
          current.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry)),
        );
      });

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "completed" as const, progress: 100 }
            : entry,
        ),
      );
    }

    isBusyRef.current = false;
    setIsBusy(false);
  }, [scope, type, items]);

  const readyCount = items.filter((item) => item.status === "idle").length;
  const completedCount = items.filter((item) => item.status === "completed").length;

  return (
    <CreateView resource="documents" title="Upload documents">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Batch settings</Card.Title>
            <Card.Description>
              The scope and type below are applied to every file in the batch.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                className="w-full"
                placeholder="Select scope"
                value={scope || null}
                variant="secondary"
                onChange={(key: Key | null) =>
                  setScope((key ? String(key) : "") as DocumentOwnerType | "")
                }
              >
                <Label>Owner scope</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {Object.entries(DOCUMENT_SCOPE_LABELS).map(([value, label]) => (
                      <ListBox.Item key={value} id={value} textValue={label}>
                        {label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select
                className="w-full"
                placeholder="Select type"
                value={type || null}
                variant="secondary"
                onChange={(key: Key | null) => setType(key ? String(key) : "")}
              >
                <Label>Document type</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                      <ListBox.Item key={value} id={value} textValue={label}>
                        {label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Files</Card.Title>
            <Card.Description>
              Drop files or click to browse. Max {formatByteSize(DOCUMENT_MAX_UPLOAD_SIZE_BYTES)}{" "}
              per file. PDF, images, or Office documents.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <FileUpload
              multiple
              accept={[...DOCUMENT_ACCEPTED_MIME_TYPES]}
              description={`Up to ${formatByteSize(DOCUMENT_MAX_UPLOAD_SIZE_BYTES)} per file`}
              isDisabled={isBusy}
              label="Drag files here or click to upload"
              maxFileSize={DOCUMENT_MAX_UPLOAD_SIZE_BYTES}
              onFilesAdded={handleFilesAdded}
            />

            {items.length > 0 ? (
              <ul aria-label="Queued uploads" className="mt-4 flex flex-col gap-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium text-foreground">
                          {item.file.name}
                        </span>
                        <span className="text-xs text-muted">
                          {formatByteSize(item.file.size)} · {item.file.type || "unknown/binary"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === "completed" ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircleIcon aria-hidden="true" className="size-4" />
                            Uploaded
                          </span>
                        ) : null}
                        {item.status === "error" ? (
                          <span className="flex items-center gap-1 text-xs text-danger">
                            <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
                            Failed
                          </span>
                        ) : null}
                        <Button
                          aria-label={`Remove ${item.file.name}`}
                          isDisabled={item.status === "uploading"}
                          size="sm"
                          variant="ghost"
                          onPress={() => removeItem(item.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {item.status === "uploading" ? (
                      <ProgressBar
                        aria-label={`Uploading ${item.file.name}`}
                        color="accent"
                        size="sm"
                        value={item.progress ?? 0}
                      >
                        <ProgressBar.Track>
                          <ProgressBar.Fill />
                        </ProgressBar.Track>
                      </ProgressBar>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card.Content>

          <Card.Footer className="items-center justify-between gap-3">
            <div className="text-xs text-muted">
              {items.length > 0 ? (
                <>
                  {items.length} file{items.length === 1 ? "" : "s"} ·{" "}
                  {formatByteSize(totalBytes)} · {completedCount} uploaded
                </>
              ) : (
                <>No files selected yet.</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onPress={() => navigate("/documents")}>
                Cancel
              </Button>
              <Button
                isDisabled={readyCount === 0 || isBusy}
                isPending={isBusy}
                variant="primary"
                onPress={performUpload}
              >
                Upload {readyCount > 0 ? `(${readyCount})` : ""}
              </Button>
            </div>
          </Card.Footer>
        </Card>

        {batchError ? (
          <div className="rounded-lg border border-danger bg-danger/5 p-3 text-sm text-danger">
            {batchError}
          </div>
        ) : null}
      </div>
    </CreateView>
  );
}
