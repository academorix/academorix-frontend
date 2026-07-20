/**
 * @file setting-visual-group.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Visual grouping section within a settings group.
 *
 *   Applied via `@Group()` on a property (client-side DTO) or emitted
 *   under `groups[]` of a server schema. Consumed by the React
 *   renderer to organise fields into collapsible or tabbed sections.
 */

/**
 * A visual sub-section within a setting group.
 *
 * Fields associate with a visual group by setting their `group`
 * property to this group's `key` (or `label`, per the Laravel API's
 * label-referenced convention — both are supported).
 */
export interface ISettingVisualGroup {
  /**
   * Unique identifier of this visual group within its owning setting
   * group. Fields reference this via their `group` property.
   */
  readonly key: string;

  /** Display label for the section heading. */
  readonly label: string;

  /** Optional description below the heading. */
  readonly description?: string;

  /**
   * Icon identifier resolved by the React layer via
   * `@stackra/ui/icons/*` or a caller-supplied registry.
   */
  readonly icon?: string;

  /** Display order relative to sibling visual groups. */
  readonly order?: number;

  /** Permissions required to view this visual group. */
  readonly permissions?: readonly string[];

  /** Permissions required to modify fields in this visual group. */
  readonly writePermissions?: readonly string[];

  /**
   * Explicit field keys owned by this group. Optional — most
   * consumers derive membership from each field's `group` reference
   * so this is only populated when a schema chooses to duplicate
   * that mapping.
   */
  readonly fieldKeys?: readonly string[];
}
