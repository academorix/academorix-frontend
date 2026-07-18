/**
 * @file index.ts
 * @module @stackra/kbd/events
 * @description Public API barrel for the `events/` category.
 *
 *   Only holds the kbd-owned event names. Consumers listen to these
 *   on the shared `EVENT_EMITTER` (from `@stackra/contracts`).
 */

export { NavigationCommands } from "./navigation.events";
export type { NavigationCommandName } from "./navigation.events";
