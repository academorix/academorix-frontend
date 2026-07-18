/**
 * @file broadcast-template.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A saved bundle of broadcast issue-options the operator
 *   can apply on subsequent link creations. `config` mirrors the shape
 *   of {@link IIssueEmbedTokenInput} so applying a template is a spread.
 */

import type { IIssueEmbedTokenInput } from "./issue-embed-token-input.interface";

/**
 * Saved broadcast template — the operator's shortcut for spinning up
 * new links with a preset combination of delivery, access, and
 * branding fields.
 */
export interface IBroadcastTemplate {
  /** UUID primary key. */
  readonly id: string;

  /** Short human-facing name shown in the picker. */
  readonly name: string;

  /** Optional description surfaced under the name in the picker. */
  readonly description?: string;

  /** Iconify token from the shared icon set. */
  readonly icon?: string;

  /**
   * The bundled issue options. Partial so the template can leave any
   * field unset — the applied form falls back to its own defaults for
   * those fields.
   */
  readonly config: Partial<IIssueEmbedTokenInput>;

  /** When `true`, the template is visible to every tenant member. */
  readonly isShared: boolean;

  /**
   * Number of times this template has been used to mint a link.
   * Incremented on every issue that carries a `templateId`.
   */
  readonly useCount: number;

  /** ISO-8601 wall-clock of the most recent use. */
  readonly lastUsedAt?: string;

  /** ISO-8601 creation time. */
  readonly createdAt: string;

  /** ISO-8601 mutation time. */
  readonly updatedAt: string;
}
