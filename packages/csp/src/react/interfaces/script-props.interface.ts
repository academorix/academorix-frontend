/**
 * @file script-props.interface.ts
 * @module @stackra/csp/react/interfaces
 * @description Props for the `<Script>` component.
 */

/**
 * Props for the {@link Script} component.
 */
export interface ScriptProps {
  /**
   * External script URL. Mutually exclusive with `content`.
   */
  src?: string;

  /**
   * Inline script content. Use when you need to inject inline JavaScript.
   */
  content?: string;

  /**
   * Load the script asynchronously.
   *
   * @default true
   */
  async?: boolean;

  /**
   * Defer script execution until the DOM is parsed.
   *
   * @default false
   */
  defer?: boolean;

  /**
   * Script `type` attribute.
   *
   * @default 'text/javascript'
   */
  type?: string;

  /**
   * Script ID for deduplication.
   */
  id?: string;

  /**
   * Callback fired when the script loads successfully.
   */
  onLoad?: () => void;

  /**
   * Callback fired when the script fails to load.
   */
  onError?: (error: Event) => void;
}
