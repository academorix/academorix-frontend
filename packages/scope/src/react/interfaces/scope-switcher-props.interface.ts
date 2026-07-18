/**
 * @file scope-switcher-props.interface.ts
 * @module @stackra/scope/react/interfaces
 * @description Props for the `<ScopeSwitcher>` component.
 */

/**
 * Props accepted by {@link ScopeSwitcher}.
 */
export interface ScopeSwitcherProps {
  /** Field label. Defaults to `'Scope'`. */
  readonly label?: string;
  /** Optional className for layout overrides. */
  readonly className?: string;
  /**
   * When `true`, selecting an option emulates it (keeps identity) instead
   * of switching to it. Defaults to `false`.
   */
  readonly emulateOnSelect?: boolean;
}
