/**
 * @file use-web-share.interface.ts
 * @module @stackra/pwa/react/hooks
 * @description Return shape for the `useWebShare()` hook.
 */

/**
 * Payload accepted by `navigator.share`.
 *
 * Kept structural — the standard `ShareData` isn't always up-to-date
 * across TypeScript lib.dom versions.
 */
export interface IWebShareData {
  /** Share title. */
  readonly title?: string;
  /** Share text (body). */
  readonly text?: string;
  /** URL to share. */
  readonly url?: string;
  /**
   * Files to share. Requires `navigator.canShare({ files })` to
   * return `true` — supported on Android + iOS 15+.
   */
  readonly files?: readonly File[];
}

/**
 * Value returned by {@link useWebShare}.
 */
export interface IUseWebShareResult {
  /** Whether the Web Share API is available in this browser. */
  readonly isSupported: boolean;
  /**
   * Show the OS share sheet. Returns `true` when the sheet completed
   * successfully; `false` when the user cancelled or the API errored.
   */
  readonly share: (data: IWebShareData) => Promise<boolean>;
}
