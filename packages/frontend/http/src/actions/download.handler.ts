/**
 * @file download.handler.ts
 * @module @stackra/http/actions
 * @description DownloadHandler — fetches a file as a blob and triggers a
 *   browser download via a hidden `<a download>` element.
 */

import { Inject, Injectable } from "@stackra/container";
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IDownloadAction,
  IHttpManager,
} from "@stackra/contracts";
import { ActionKind, HTTP_MANAGER } from "@stackra/contracts";

/**
 * `DownloadHandler` — dispatch handler for `ActionKind.Download`.
 *
 * On web: fetches the blob, creates an object URL, triggers a hidden
 * `<a download>` click, revokes the URL.
 *
 * On native: delegates to a caller-supplied
 * `context.metadata.nativeDownload(blobUrl, filename)` if present;
 * otherwise returns a failure telling the caller no native handler is
 * configured.
 */
@Injectable()
export class DownloadHandler implements IActionHandler<IDownloadAction> {
  public readonly kind = ActionKind.Download;

  public constructor(@Inject(HTTP_MANAGER) private readonly http: IHttpManager) {}

  public async execute(
    descriptor: IDownloadAction,
    context: IActionContext,
  ): Promise<IActionResponse> {
    if (context.signal?.aborted) return { success: false, message: "Aborted" };

    const client = await this.http.connection();
    try {
      const response = await client.request({
        url: descriptor.endpoint,
        method: descriptor.method ?? "GET",
        params: descriptor.params,
        responseType: "blob",
        signal: context.signal,
      });

      if (typeof window === "undefined" || typeof document === "undefined") {
        const nativeDownload = context.metadata?.nativeDownload as
          ((url: string, filename?: string) => void) | undefined;
        if (nativeDownload) {
          nativeDownload(String(response.data), descriptor.filename);
          return { success: true };
        }
        return {
          success: false,
          message: "No native download handler available in IActionContext.metadata",
        };
      }

      const url = URL.createObjectURL(response.data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = descriptor.filename ?? "";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Download failed",
      };
    }
  }
}
