/**
 * @file prerender-result.interface.ts
 * @module @stackra/routing/vite/interfaces
 * @description Shape returned by the prerender pipeline.
 *
 *   The pipeline is testable in isolation — `prerenderRoutes(config)`
 *   returns a strongly-typed `IPrerenderResult` describing every HTML
 *   output it produced + the errors it captured. The plugin's build
 *   hook writes the outputs to disk and reports the errors to Vite's
 *   logger.
 */

/**
 * A single prerender output.
 */
export interface IPrerenderOutput {
  /**
   * Route path the output was produced for (with params substituted).
   *
   * @example `'/blog/first-post'`
   */
  readonly path: string;

  /**
   * Subdomain the output belongs to. `null` when the route is not
   * subdomain-scoped. Subdomained outputs land under
   * `<outputDir>/<subdomain>/<path>/index.html`; apex outputs land
   * under `<outputDir>/<path>/index.html`.
   */
  readonly subdomain: string | null;

  /**
   * Fully-rendered HTML shell — includes head tags, the rendered
   * React tree, and the `__STACKRA_NONCE__` placeholder for the
   * runtime CSP nonce.
   */
  readonly html: string;
}

/**
 * A prerender error captured during the walk. Fail-soft: individual
 * loader failures produce an entry here rather than aborting the
 * whole build. `page.prerender` function failures are hard errors
 * (they abort the walk).
 */
export interface IPrerenderError {
  /**
   * Route path that failed to render (best-effort — the exact param
   * bag that caused the failure).
   */
  readonly path: string;

  /**
   * Subdomain the failing route belonged to, when applicable.
   */
  readonly subdomain: string | null;

  /**
   * The captured `Error`. Never `undefined` — the pipeline coerces
   * unknown throw values to `Error` before pushing.
   */
  readonly error: Error;
}

/**
 * The result of a prerender walk.
 */
export interface IPrerenderResult {
  /** Every successfully-rendered output. */
  readonly outputs: readonly IPrerenderOutput[];

  /** Errors captured during the walk (fail-soft loader throws). */
  readonly errors: readonly IPrerenderError[];
}
