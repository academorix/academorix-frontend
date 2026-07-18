/**
 * @file match-descriptor.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Compact descriptor of a single matched route in the
 *   current match chain. Modelled after RRv7's `Match` but framework-
 *   scoped so consumers don't type against `react-router` directly.
 */

/**
 * Compact descriptor of one matched route.
 */
export interface IMatchDescriptor<TData = unknown, TParams = Record<string, string>> {
  /** Matched pathname. */
  readonly pathname: string;

  /** Path segment that produced this match. */
  readonly pathnameBase: string;

  /** Path params extracted from this segment. */
  readonly params: Readonly<TParams>;

  /** Route id — matches the id assigned by the framework's adapter. */
  readonly id: string;

  /** Loader data resolved for this match (undefined until loaded). */
  readonly data?: TData;

  /**
   * Route-level metadata bag — the framework colocates
   * `breadcrumb`, `analytics`, and the private `[STACKRA_HANDLE]`
   * fields here. Consumers rarely read this directly.
   */
  readonly handle?: Readonly<Record<string, unknown>>;
}
