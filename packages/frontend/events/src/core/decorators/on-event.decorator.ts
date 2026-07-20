/**
 * @file on-event.decorator.ts
 * @module @stackra/events/core/decorators
 *
 * @description
 * Re-exports the `@OnEvent(...)` decorator from `@stackra/decorators/events`.
 *
 * The canonical implementation now lives in `@stackra/decorators` so
 * feature packages can declare event listeners without pulling the
 * full `@stackra/events` runtime. This shim keeps the legacy import
 * path working.
 */

export { OnEvent, onEventMetadata } from "@stackra/decorators/events";
