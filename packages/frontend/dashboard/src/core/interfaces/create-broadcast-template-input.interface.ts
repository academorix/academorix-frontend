/**
 * @file create-broadcast-template-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Payload for
 *   {@link IDashboardStorageAdapter.createBroadcastTemplate}. Backend
 *   mints `id`, `useCount`, `createdAt`, `updatedAt`; the caller
 *   supplies the descriptive payload and initial share flag.
 */

import type { IIssueEmbedTokenInput } from "./issue-embed-token-input.interface";

/**
 * Client-supplied fields for a new broadcast template.
 */
export interface ICreateBroadcastTemplateInput {
  /** Short human-facing name shown in the picker. */
  readonly name: string;

  /** Optional description surfaced under the name in the picker. */
  readonly description?: string;

  /** Iconify token from the shared icon set. */
  readonly icon?: string;

  /** Bundled issue-token options. Partial — any field may be unset. */
  readonly config: Partial<IIssueEmbedTokenInput>;

  /** When `true`, the template is visible to every tenant member. */
  readonly isShared?: boolean;
}
