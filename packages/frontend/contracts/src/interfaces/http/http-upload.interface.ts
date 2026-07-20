/**
 * @file http-upload.interface.ts
 * @module @stackra/contracts/interfaces/http
 * @description Upload option/result contracts used by `UploadService`.
 */

/** Progress callback used by upload flows — `(percentage, loaded, total)`. */
export type IHttpProgressCallback = (percentage: number, loaded: number, total: number) => void;

/** A progress event fanned out by the progress middleware. */
export interface IHttpProgressEvent {
  /** Unique per-request identifier. */
  requestId: string;
  /** Direction of transfer. */
  type: "upload" | "download";
  /** Bytes transferred so far. */
  loaded: number;
  /** Total bytes, or `0` when unknown. */
  total: number;
  /** Completion percentage (0..100). */
  percentage: number;
}

/** Listener for `IHttpProgressEvent`s emitted by the progress middleware. */
export type IHttpProgressListener = (event: IHttpProgressEvent) => void;

/** Options for direct (multipart) uploads. */
export interface IHttpUploadOptions {
  /** Form field name (defaults to `file`/`files`). */
  fieldName?: string;
  /** Extra multipart fields. */
  fields?: Record<string, string>;
  /** Extra request headers. */
  headers?: Record<string, string>;
  /** External cancellation signal. */
  signal?: AbortSignal;
  /** Extra request metadata. */
  meta?: Record<string, unknown>;
  /** Progress callback. */
  onProgress?: IHttpProgressCallback;
}

/** Options for chunked/resumable uploads. */
export interface IHttpChunkedUploadOptions {
  /** Chunk size in bytes (defaults to 5 MiB). */
  chunkSize?: number;
  /** Endpoint that initialises the chunked upload. */
  initEndpoint?: string;
  /** Endpoint that finalises the chunked upload. */
  finalizeEndpoint?: string;
  /** Extra fields sent with the init request. */
  fields?: Record<string, unknown>;
  /** External cancellation signal. */
  signal?: AbortSignal;
  /** Extra request metadata. */
  meta?: Record<string, unknown>;
  /** Progress callback. */
  onProgress?: IHttpProgressCallback;
}

/** Result of a presigned-URL request. */
export interface IHttpPresignedUrlResult {
  /** The presigned upload URL. */
  url: string;
  /** Extra form fields required by the target (e.g. S3 POST policy). */
  fields?: Record<string, string>;
  /** HTTP method to use against the presigned URL. */
  method?: string;
  /** Headers required by the presigned URL. */
  headers?: Record<string, string>;
  /** Expiry timestamp (ms since epoch). */
  expiresAt?: number;
}
