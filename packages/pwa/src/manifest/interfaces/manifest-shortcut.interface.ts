/**
 * @file manifest-shortcut.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description A single home-screen shortcut.
 */

import type { IManifestIcon } from './manifest-icon.interface';

/**
 * Home-screen shortcut declared in the manifest.
 *
 * The `id` field is our own extension — used for translation
 * lookups when the caller doesn't want to key by `url`. It is
 * stripped from the emitted manifest so the wire shape stays
 * spec-compliant.
 */
export interface IManifestShortcut {
  /** Internal id — used for translation lookups. Stripped on emit. */
  readonly id?: string;
  /** Human-readable name shown in the launcher's shortcut menu. */
  readonly name: string;
  /** Short name (target ≤ 12 chars per HIG). */
  readonly short_name?: string;
  /** Description shown in the launcher's shortcut menu. */
  readonly description?: string;
  /** URL to open when the shortcut is activated. */
  readonly url: string;
  /** Optional per-shortcut icon set. */
  readonly icons?: readonly IManifestIcon[];
}
