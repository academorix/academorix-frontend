/**
 * UploadService.
 *
 * High-level file-upload helper built on the manager's default
 * `IHttpClient`. Three strategies:
 *
 * - {@link upload}                 — direct multipart POST.
 * - {@link uploadMany}             — multiple files in one request.
 * - {@link getPresignedUrl} +
 *   {@link uploadToPresignedUrl}   — server-presigned PUT direct to
 *   cloud storage (S3 / R2 / GCS).
 * - {@link uploadChunked}          — split into chunks for resumable
 *   uploads with optional init/finalize endpoints.
 *
 * @module @stackra/http/services/upload-service
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import {
  HTTP_CLIENT,
  type IHttpChunkedUploadOptions,
  type IHttpClient,
  type IHttpPresignedUrlResult,
  type IHttpResponse,
  type IHttpUploadOptions,
} from "@stackra/contracts";

import { HttpDriverError } from "../errors";

/**
 * Upload helper service.
 */
@Injectable()
export class UploadService {
  /**
   * @param http - Default-connection HTTP client (optional — may not be available in browser-only contexts).
   */
  public constructor(@Optional() @Inject(HTTP_CLIENT) private readonly http?: IHttpClient) {}

  /**
   * Resolve the default HTTP client, throwing when none is registered.
   *
   * @returns The injected `IHttpClient`.
   * @throws {HttpDriverError} when no `HTTP_CLIENT` is available.
   */
  private requireClient(): IHttpClient {
    if (!this.http) {
      throw new HttpDriverError(
        "[UploadService] no HTTP_CLIENT is registered — configure HttpModule.forRoot() with a default connection.",
      );
    }
    return this.http;
  }

  // ────────────────────────────────────────────────────────────────────
  // Direct upload
  // ────────────────────────────────────────────────────────────────────

  /**
   * Upload a single file via multipart POST.
   *
   * @typeParam T - Expected response body shape.
   * @param url     - Upload endpoint.
   * @param file    - File or Blob to send.
   * @param options - Upload options.
   * @returns Final HTTP response.
   */
  public async upload<T = unknown>(
    url: string,
    file: File | Blob,
    options: IHttpUploadOptions = {},
  ): Promise<IHttpResponse<T>> {
    const formData = new FormData();
    const fieldName = options.fieldName ?? "file";
    formData.append(fieldName, file);

    if (options.fields) {
      for (const [key, value] of Object.entries(options.fields)) {
        formData.append(key, value);
      }
    }

    return this.requireClient().post<T>(url, formData, {
      headers: options.headers,
      onUploadProgress: this.adaptProgress(options.onProgress),
      signal: options.signal,
      meta: { ...options.meta, isUpload: true },
    });
  }

  /**
   * Upload many files in a single request.
   *
   * @typeParam T - Expected response body shape.
   * @param url     - Upload endpoint.
   * @param files   - Files to attach. Field name becomes `${fieldName}[]`.
   * @param options - Upload options.
   * @returns Final HTTP response.
   */
  public async uploadMany<T = unknown>(
    url: string,
    files: Array<File | Blob>,
    options: IHttpUploadOptions = {},
  ): Promise<IHttpResponse<T>> {
    const formData = new FormData();
    const fieldName = options.fieldName ?? "files";

    for (const file of files) {
      formData.append(`${fieldName}[]`, file);
    }

    if (options.fields) {
      for (const [key, value] of Object.entries(options.fields)) {
        formData.append(key, value);
      }
    }

    return this.requireClient().post<T>(url, formData, {
      headers: options.headers,
      onUploadProgress: this.adaptProgress(options.onProgress),
      signal: options.signal,
      meta: { ...options.meta, isUpload: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // Presigned URL flow
  // ────────────────────────────────────────────────────────────────────

  /**
   * Request a presigned URL from the backend.
   *
   * @typeParam P - Param shape forwarded to the backend.
   * @param url    - Presign endpoint.
   * @param params - Backend params (filename, contentType, …).
   * @returns Backend's presigned URL response.
   */
  public async getPresignedUrl<P extends Record<string, unknown>>(
    url: string,
    params: P,
  ): Promise<IHttpPresignedUrlResult> {
    const response = await this.requireClient().post<IHttpPresignedUrlResult>(url, params);
    return response.data;
  }

  /**
   * Upload directly to a presigned URL.
   *
   * @param presignedUrl - URL returned by {@link getPresignedUrl}.
   * @param file         - File to upload.
   * @param options      - Subset of upload options (no fields).
   * @returns Cloud-storage response.
   */
  public async uploadToPresignedUrl(
    presignedUrl: string,
    file: File | Blob,
    options: Pick<IHttpUploadOptions, "onProgress" | "headers" | "signal"> = {},
  ): Promise<IHttpResponse> {
    return this.requireClient().put(presignedUrl, file, {
      // Clear baseURL — the presigned URL is absolute.
      baseURL: "",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        ...options.headers,
      },
      onUploadProgress: this.adaptProgress(options.onProgress),
      signal: options.signal,
      meta: { skipAuth: true, isUpload: true },
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // Chunked upload
  // ────────────────────────────────────────────────────────────────────

  /**
   * Upload a large file as a sequence of chunks.
   *
   * @typeParam T - Expected response body shape from finalisation.
   * @param url     - Chunk upload endpoint.
   * @param file    - File to upload.
   * @param options - Chunked-upload options.
   * @returns Response from the finalize endpoint, or a synthetic
   *   summary when no finalize endpoint is configured.
   */
  public async uploadChunked<T = unknown>(
    url: string,
    file: File | Blob,
    options: IHttpChunkedUploadOptions = {},
  ): Promise<IHttpResponse<T>> {
    const chunkSize = options.chunkSize ?? 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadId: string | undefined;

    if (options.initEndpoint) {
      const initResponse = await this.requireClient().post<{
        uploadId?: string;
        id?: string;
      }>(
        options.initEndpoint,
        {
          filename: (file as File).name ?? "upload",
          size: file.size,
          totalChunks,
          contentType: file.type,
          ...options.fields,
        },
        { signal: options.signal, meta: options.meta },
      );
      uploadId = initResponse.data.uploadId ?? initResponse.data.id;
    }

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);
      formData.append("chunkIndex", String(i));
      formData.append("totalChunks", String(totalChunks));
      if (uploadId !== undefined) formData.append("uploadId", uploadId);

      await this.requireClient().post(url, formData, {
        signal: options.signal,
        meta: { ...options.meta, isUpload: true },
      });

      if (options.onProgress) {
        const overallPct = Math.round(((i + 1) / totalChunks) * 100);
        const overallLoaded = Math.min((i + 1) * chunkSize, file.size);
        options.onProgress(overallPct, overallLoaded, file.size);
      }
    }

    if (options.finalizeEndpoint) {
      return this.requireClient().post<T>(
        options.finalizeEndpoint,
        {
          uploadId,
          totalChunks,
          filename: (file as File).name ?? "upload",
          ...options.fields,
        },
        { signal: options.signal, meta: options.meta },
      );
    }

    return {
      data: { uploadId, totalChunks, size: file.size } as unknown as T,
      status: 200,
      statusText: "OK",
      headers: {},
    } as IHttpResponse<T>;
  }

  // ────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────

  /**
   * Build an `AbortController` consumers can pass through
   * `IHttpUploadOptions.signal` and abort externally.
   */
  public createAbortController(): { signal: AbortSignal; abort: () => void } {
    const controller = new AbortController();
    return {
      signal: controller.signal,
      abort: () => controller.abort(),
    };
  }

  /**
   * Adapt the high-level `(percentage, loaded, total)` callback to
   * the low-level `(event)` callback consumed by axios / fetch.
   */
  private adaptProgress(
    callback: IHttpUploadOptions["onProgress"],
  ): ((event: unknown) => void) | undefined {
    if (!callback) return undefined;
    return (event: unknown) => {
      const evt = event as { loaded?: number; total?: number };
      const loaded = evt.loaded ?? 0;
      const total = evt.total ?? 0;
      const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
      callback(percentage, loaded, total);
    };
  }
}
