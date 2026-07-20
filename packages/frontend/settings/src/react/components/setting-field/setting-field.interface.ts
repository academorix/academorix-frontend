/**
 * @file setting-field.interface.ts
 * @module @stackra/settings/react/components/setting-field
 * @description Props accepted by `<SettingField>` — the dispatcher
 *   that maps a `ControlType` to the matching HeroUI compound.
 */

import type { ReactNode } from "react";
import type { ISettingField } from "@stackra/contracts";

/** Props accepted by `<SettingField>`. */
export interface ISettingFieldProps {
  /** The field descriptor sourced from the registry. */
  readonly field: ISettingField;

  /** Current value of the field. */
  readonly value: unknown;

  /** Handler called when the user commits a new value. */
  readonly onChange: (next: unknown) => void;

  /**
   * Whether the field is read-only. Complements the descriptor's
   * `readOnly` flag — either one flips the control into read-only
   * mode. Useful for RBAC gating done at the row-render level.
   */
  readonly isReadOnly?: boolean;

  /**
   * Whether the field is disabled entirely. Combines with
   * `field.readOnly`; consumers use this for parent-level gates
   * (e.g. an entire group disabled while a save is in flight).
   */
  readonly isDisabled?: boolean;

  /**
   * Optional class name forwarded to the outer HeroUI compound's
   * `className`. Standard Tailwind layout utilities only — no
   * bespoke styling (see `.kiro/steering/ui-components.md`).
   */
  readonly className?: string;

  /**
   * Optional icon renderer. Receives the descriptor's `icon` string
   * (or `undefined`) and returns the matching icon component. Used
   * when a field carries `icon: 'monitor'` etc. Not called for
   * fields with no icon.
   */
  readonly renderIcon?: (icon: string) => ReactNode;
}
