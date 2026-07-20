/**
 * @file use-app-update-notifier.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Options for the {@link useAppUpdateNotifier} hook.
 *
 *   The notifier composes over HeroUI's imperative `toast()` API —
 *   consumers own the message copy + variant selection through the
 *   options; the hook handles the transition detection (only fire on
 *   `false → true`, and again when `latest` changes to a different
 *   version).
 */

/**
 * Options accepted by {@link useAppUpdateNotifier}.
 */
export interface IUseAppUpdateNotifierOptions {
  /**
   * Toast title. Receives the latest version so callers can
   * interpolate. Defaults to `'App update available'`.
   */
  readonly title?: string | ((latest: string | undefined) => string);

  /**
   * Toast description. Receives the latest version. Return `null`
   * to render no description. Defaults to
   * `` `Version {latest} is ready to install.` `` when `latest` is
   * known, otherwise `'A newer version is ready to install.'`.
   */
  readonly description?: ((latest: string | undefined) => string | null) | string | null;

  /**
   * Label for the "download" action. Defaults to `'Update now'`.
   */
  readonly updateLabel?: string;

  /**
   * Toast timeout in ms. Set to `0` for a persistent toast that
   * only closes when the user dismisses or accepts. When the update
   * is mandatory the notifier forces `timeout: 0` regardless.
   *
   * @default `0`
   */
  readonly timeout?: number;

  /**
   * Whether the notifier is active. When `false`, no toast is
   * dispatched even if an update lands. Useful for tests + for
   * routes where the toast should be suppressed.
   *
   * @default `true`
   */
  readonly enabled?: boolean;
}
