/**
 * @file setting-field.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Resolved metadata for a single setting field.
 *
 *   Built either by the `@Field()` decorator (client-declared DTO) or
 *   by `SettingsRegistry.registerFromSchema()` (server-declared JSON
 *   schema). Both paths converge on this shape so downstream code —
 *   the service's default resolver, the React dispatcher, the
 *   validation runner — is source-agnostic.
 */

import type { ControlType } from "../../enums/control-type.enum";
import type { ISettingFieldOption } from "./setting-field-option.interface";
import type { ISettingValidationRule } from "./setting-validation-rule.interface";

/**
 * A single setting field's resolved metadata.
 *
 * `control` accepts a `ControlType` enum case OR any custom string —
 * the React dispatcher falls back to a generic text input when it
 * doesn't recognise the identifier.
 */
export interface ISettingField {
  /** Property key / field identifier. Unique within a group. */
  readonly key: string;

  /**
   * UI control type. A `ControlType` case for the built-ins, or a
   * custom string when the app has registered a bespoke renderer.
   */
  readonly control: ControlType | (string & {});

  /** Display label (plain string or i18n key). */
  readonly label: string;

  /** Optional description / help text rendered under the field. */
  readonly description?: string;

  /** Placeholder text for text-based inputs. */
  readonly placeholder?: string;

  /** Default value when no stored value exists for the field. */
  readonly defaultValue: unknown;

  /**
   * Static options for select-family fields. Prefer this over
   * `optionsProvider` when the option list is known at declaration
   * time.
   */
  readonly options?: readonly ISettingFieldOption[];

  /**
   * Dynamic options provider — called at render time to fetch
   * options. Takes precedence over `options` when both are set.
   */
  readonly optionsProvider?: () => ISettingFieldOption[] | Promise<ISettingFieldOption[]>;

  /** Minimum value (`number` / `slider`). */
  readonly min?: number;

  /** Maximum value (`number` / `slider`). */
  readonly max?: number;

  /** Step increment (`number` / `slider`). */
  readonly step?: number;

  /** Validation rules applied on update. */
  readonly validation?: readonly ISettingValidationRule[];

  /** Display order (lower = first). Defaults to `0`. */
  readonly order?: number;

  /**
   * Icon identifier resolved by the React layer via
   * `@stackra/ui/icons/*` or a caller-supplied registry.
   */
  readonly icon?: string;

  /**
   * Conditional visibility — the field is rendered only when the
   * referenced sibling field currently equals `value`.
   */
  readonly visibleWhen?: { readonly key: string; readonly value: unknown };

  /** When true, the field is read-only in the UI. */
  readonly readOnly?: boolean;

  /**
   * Sensitive value (passwords, API keys). The server masks reads
   * and never includes the value in audit-log old/new snapshots.
   */
  readonly sensitive?: boolean;

  /** Whether changing this field requires an app restart to take effect. */
  readonly requiresRestart?: boolean;

  /** Permissions required to view this field (subset of group permissions). */
  readonly permissions?: readonly string[];

  /** Permissions required to modify this field. */
  readonly writePermissions?: readonly string[];

  /**
   * Reference to a visual `ISettingVisualGroup` label — the field
   * renders under the matching section.
   */
  readonly group?: string;

  /**
   * Reference to a visual `ISettingSection` label — the field is
   * preceded by the matching divider.
   */
  readonly section?: string;

  /** Arbitrary metadata pass-through for custom renderers. */
  readonly meta?: Readonly<Record<string, unknown>>;
}
