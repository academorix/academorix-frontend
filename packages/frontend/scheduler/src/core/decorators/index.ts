/**
 * @file index.ts
 * @module @stackra/scheduler/core/decorators
 * @description Barrel export for scheduler decorators.
 *
 *   The `IScheduledOptions` type lives in `../interfaces/` and is
 *   imported as a `type` inside the decorator file. We re-export it
 *   here from the canonical interface module so consumers have a
 *   single import path: `from '@stackra/scheduler'`.
 */

export { Scheduled } from "./scheduled.decorator";
export type { IScheduledOptions } from "@/core/interfaces/scheduled-options.interface";
