/**
 * @file native-scope-switcher-props.interface.ts
 * @module @stackra/scope/native/interfaces
 * @description Props for {@link NativeScopeSwitcher}.
 */

/**
 * Props accepted by {@link NativeScopeSwitcher}.
 *
 * Mirrors the web `ScopeSwitcherProps` shape so a cross-platform app
 * can treat the switcher generically: pass the same props to whichever
 * import (`@stackra/scope/react` vs `@stackra/scope/native`) the
 * platform selects.
 */
export interface NativeScopeSwitcherProps {
  /** Field label rendered above the trigger. Defaults to `'Scope'`. */
  readonly label?: string;

  /**
   * Placeholder text for the trigger when nothing is selected. Defaults
   * to `'Select a scope...'`.
   */
  readonly placeholder?: string;

  /**
   * Optional Tailwind (Uniwind) className applied to the outer `View`
   * for layout tuning (e.g., `'mt-4 w-full'`).
   */
  readonly className?: string;

  /**
   * When `true`, selecting an option emulates it (keeps identity)
   * instead of switching to it. Defaults to `false`.
   */
  readonly emulateOnSelect?: boolean;

  /**
   * Which HeroUI Native `Select` presentation to use. `'bottom-sheet'`
   * is the mobile-first default; `'popover'` fits tablet layouts;
   * `'dialog'` centres the picker. See HeroUI Native `Select` docs.
   */
  readonly presentation?: 'bottom-sheet' | 'popover' | 'dialog';
}
