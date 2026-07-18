/**
 * @file middleware-group.interface.ts
 * @module @stackra/routing/core/interfaces
 * @description Internal shape of a named middleware group.
 *
 *   Groups live inside `MiddlewareRegistryService`. A group bundles
 *   several middleware / guard names under a single reference (e.g.
 *   `middleware: ['@web']`) so routes don't repeat cross-cutting
 *   pipelines.
 */

/**
 * A named bundle of middleware / guard references.
 *
 * Group names must begin with `@` — the resolver relies on the
 * prefix to distinguish group names from plain middleware names.
 */
export interface IMiddlewareGroup {
  /** Group name — must start with `@`. */
  readonly name: `@${string}`;

  /**
   * Members — each entry is a middleware name, a guard name, or the
   * name of another group. The resolver expands nested groups at
   * bootstrap and rejects cycles via `MiddlewareCycleDetectedError`.
   */
  readonly members: readonly string[];

  /** Free-form description surfaced in dev tools. */
  readonly description?: string;
}
