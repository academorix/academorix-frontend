/**
 * @file index.ts
 * @module @stackra/routing/middleware/signals
 * @description Public API barrel for the middleware / guard signals.
 *
 *   Each signal file exports both the `Error`-subclass signal class
 *   and its ergonomic thrower helper — one conceptual unit per file.
 */

export { RedirectSignal, redirect } from "./redirect.signal";
export { NotFoundSignal, notFound } from "./not-found.signal";
export { MiddlewareAbortSignal, abort } from "./abort.signal";
