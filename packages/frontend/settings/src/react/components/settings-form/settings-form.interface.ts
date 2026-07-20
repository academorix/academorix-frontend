/**
 * @file settings-form.interface.ts
 * @module @stackra/settings/react/components/settings-form
 * @description Props accepted by `<SettingsForm>`.
 */

import type { ReactNode } from "react";
import type { ISettingDefinition, ISettingField, Type } from "@stackra/contracts";

/** Props accepted by `<SettingsForm>`. */
export interface ISettingsFormProps {
  /**
   * The group to render. Accepts either a DTO constructor (for
   * client-declared groups) or a group key string (for schemas
   * loaded from the API).
   */
  readonly group: Type | string;

  /**
   * Optional filter applied to the fields before render. Return
   * `false` to hide a field — useful for RBAC gating done at the
   * render layer.
   */
  readonly fieldFilter?: (field: ISettingField) => boolean;

  /**
   * Optional custom renderer for a single field. Overrides the
   * default `<SettingField>` dispatcher. Receives the field
   * descriptor + a bound value/onChange pair.
   */
  readonly renderField?: (args: {
    readonly field: ISettingField;
    readonly value: unknown;
    readonly onChange: (next: unknown) => void;
  }) => ReactNode;

  /**
   * Optional header renderer. Called once with the resolved
   * definition — usually renders the group's label + description.
   * Return `null` to omit the header entirely.
   */
  readonly renderHeader?: (definition: ISettingDefinition) => ReactNode;

  /** Additional class name for the form root. */
  readonly className?: string;

  /** Whether every field renders read-only. */
  readonly isReadOnly?: boolean;

  /** Whether every field is disabled. */
  readonly isDisabled?: boolean;
}
