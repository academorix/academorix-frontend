/**
 * @file widget.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Widgets API entry — declares one PWA-provided widget
 *   surfaced by the host OS (Windows widgets board, Android widgets).
 *
 *   Every field except `name` is optional. The `ms_ac_template`
 *   field is Microsoft's Adaptive Cards Template JSON; other browsers
 *   ignore it.
 */

import type { IManifestIcon } from './manifest-icon.interface';
import type { IManifestScreenshot } from './manifest-screenshot.interface';

/**
 * One widget declaration.
 *
 * The shape mirrors the W3C Widgets API draft — fields Chromium /
 * Edge / Windows recognise are typed; free-form additions are
 * accepted at the `[key: string]: unknown` tail on the enclosing
 * manifest.
 */
export interface IWidget {
  /** Human-readable widget name. */
  readonly name: string;
  /**
   * Stable widget tag — used by the host OS to identify the widget
   * across updates.
   */
  readonly tag?: string;
  /** One-line description shown in the OS widgets picker. */
  readonly description?: string;
  /** Legacy template descriptor. */
  readonly template?: string;
  /** Microsoft Adaptive Cards Template JSON URL. */
  readonly ms_ac_template?: string;
  /** Data URL / JSON URL the widget renders from. */
  readonly data?: string;
  /** MIME type of the data endpoint. */
  readonly type?: string;
  /** Screenshots of the widget for the picker. */
  readonly screenshots?: readonly IManifestScreenshot[];
  /** Icons used inside the widget picker. */
  readonly icons?: readonly IManifestIcon[];
  /** Background images (Windows-specific tile backgrounds). */
  readonly backgrounds?: readonly IManifestIcon[];
  /** Whether the widget requires auth before rendering. */
  readonly auth?: boolean;
  /** Refresh interval in seconds. */
  readonly update?: number;
}
