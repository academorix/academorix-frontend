/**
 * @file setting-validation-rule.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Validation rule shape for a single setting field.
 *
 *   Consumed by the client-side form renderer (before `setMany` is
 *   dispatched) AND round-trips to the server which applies its own
 *   Laravel validation rules on `PUT`.
 */

/** Validation rule for a setting field. */
export interface ISettingValidationRule {
  /** Rule kind. */
  readonly type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern" | "custom";

  /** Rule parameter (min value, regex string, etc.). */
  readonly value?: unknown;

  /** i18n key or plain string for the validation-error message. */
  readonly message?: string;

  /**
   * Custom validator invoked when `type === 'custom'`. Returns `true`
   * on success or a message string on failure. Optional — rules
   * received from the server never carry a function.
   */
  readonly validator?: (value: unknown) => true | string;
}
