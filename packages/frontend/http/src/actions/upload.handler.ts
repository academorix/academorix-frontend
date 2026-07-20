/**
 * @file upload.handler.ts
 * @module @stackra/http/actions
 * @description UploadHandler — POST/PUT/PATCH one or more files as
 *   multipart/form-data.
 */

import { Inject, Injectable } from '@stackra/container';
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IHttpManager,
  IUploadAction,
} from '@stackra/contracts';
import { ActionKind, HTTP_MANAGER } from '@stackra/contracts';

/**
 * `UploadHandler` — dispatch handler for `ActionKind.Upload`.
 */
@Injectable()
export class UploadHandler implements IActionHandler<IUploadAction> {
  public readonly kind = ActionKind.Upload;

  public constructor(@Inject(HTTP_MANAGER) private readonly http: IHttpManager) {}

  public async execute(
    descriptor: IUploadAction,
    context: IActionContext
  ): Promise<IActionResponse> {
    if (context.signal?.aborted) return { success: false, message: 'Aborted' };
    if (typeof FormData === 'undefined') {
      return { success: false, message: 'FormData unavailable in this environment' };
    }

    const form = new FormData();
    const field = descriptor.fieldName ?? 'file';
    for (const file of descriptor.files) {
      const name = (file as File).name ?? 'upload';
      form.append(field, file as Blob, name);
    }

    try {
      const client = await this.http.connection();
      const response = await client.request({
        url: descriptor.endpoint,
        method: descriptor.method ?? 'POST',
        data: form,
        signal: context.signal,
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Upload failed' };
    }
  }
}
