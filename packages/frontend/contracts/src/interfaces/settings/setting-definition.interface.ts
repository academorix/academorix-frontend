/**
 * @file setting-definition.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Fully-resolved definition of a settings group.
 *
 *   Built either by the `@Setting()` class decorator (client-side DTO)
 *   or by `SettingsRegistry.registerFromSchema()` (server-side JSON
 *   schema). Both paths converge on this shape so the service, the
 *   React renderer, and the audit / broadcast layers stay
 *   source-agnostic.
 */

import type { SettingScope } from "../../enums/setting-scope.enum";
import type { ISettingField } from "./setting-field.interface";
import type { ISettingSection } from "./setting-section.interface";
import type { ISettingVisualGroup } from "./setting-visual-group.interface";

/**
 * A resolved setting group definition stored in `ISettingsRegistry`.
 *
 * Fields, visual groups, and sections are the three organisational
 * axes the admin UI uses:
 * - `fields` — every editable value in this group.
 * - `groups` — visual sub-sections; fields reference them via
 *   `ISettingField.group`.
 * - `sections` — one-off dividers preceding a specific field;
 *   fields reference them via `ISettingField.section`.
 */
export interface ISettingDefinition {
  /**
   * Unique group key — mirrors the Laravel Spatie group name and
   * doubles as the API route segment (`/api/v1/settings/{group}`).
   */
  readonly key: string;

  /** Display label (plain string or i18n key). */
  readonly label: string;

  /** Optional description surfaced in the admin UI. */
  readonly description?: string;

  /**
   * Icon identifier resolved by the React layer via
   * `@stackra/ui/icons/*` or an app-provided registry.
   */
  readonly icon?: string;

  /**
   * Display order relative to other groups. Lower values render
   * first. Defaults to `0`.
   */
  readonly order?: number;

  /**
   * Hierarchy scope. `system` groups have a single global value;
   * `tenant` groups can be overridden per tenant; `user` groups
   * can be overridden per user.
   */
  readonly scope?: SettingScope;

  /**
   * Whether the read endpoint is publicly accessible. `false` groups
   * require authentication (and the caller must hold `permissions`
   * to view / `writePermissions` to update).
   */
  readonly public?: boolean;

  /** Permission strings required to view this group. */
  readonly permissions?: readonly string[];

  /** Permission strings required to modify this group. */
  readonly writePermissions?: readonly string[];

  /**
   * The DTO constructor for client-declared groups. `null` for
   * groups registered from a server schema (there is no local class).
   */
  readonly dto: (new (...args: unknown[]) => unknown) | null;

  /** Every field this group owns, resolved from `@Field()` or schema. */
  readonly fields: readonly ISettingField[];

  /**
   * Visual sub-groups within this group. Fields reference them via
   * `ISettingField.group`.
   */
  readonly groups: readonly ISettingVisualGroup[];

  /**
   * Visual dividers keyed by field key. Rendered above the matching
   * field. Optional — many groups have none.
   */
  readonly sections?: Readonly<Record<string, ISettingSection>>;

  /** Arbitrary metadata for custom consumers / renderers. */
  readonly meta?: Readonly<Record<string, unknown>>;
}
