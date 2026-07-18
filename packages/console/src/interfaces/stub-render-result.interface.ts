/**
 * @file stub-render-result.interface.ts
 * @module @stackra/console/interfaces
 * @description Result returned by `StubRenderer#render(...)` — the rendered
 *   content string plus the path of the source template (for diagnostics).
 */

/**
 * Result of a stub render operation.
 */
export interface IStubRenderResult {
  /** The fully-rendered template content, ready to write to disk. */
  readonly content: string;

  /**
   * Absolute path of the template source that produced this content.
   * Useful for error messages and debugging.
   */
  readonly templatePath: string;
}
