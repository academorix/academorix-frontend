/**
 * @file error-props.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Props passed to a route's `ErrorComponent` slot when a
 *   loader / guard / component throws.
 */

/**
 * Props passed to an `ErrorComponent` shipped by a route.
 *
 * The framework matches on RRv7's error boundary contract but exposes
 * a Stackra-native prop shape so error fallbacks stay decoupled from
 * `useRouteError()`.
 */
export interface IErrorProps {
  /**
   * The thrown value. Can be any type — user throws are common
   * alongside `Error` instances.
   */
  readonly error: unknown;

  /**
   * When the error is an HTTP response (e.g. thrown from a fetcher),
   * the status code. Otherwise `undefined`.
   */
  readonly status?: number;

  /**
   * Optional retry callback wired to `useRevalidator().revalidate()`.
   * Fallbacks can render a "Try again" button that calls this.
   */
  readonly retry?: () => void;
}
