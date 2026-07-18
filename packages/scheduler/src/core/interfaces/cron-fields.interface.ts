/**
 * @file cron-fields.interface.ts
 * @module @stackra/scheduler/interfaces
 * @description Parsed cron expression fields.
 */

/**
 * Parsed cron expression fields.
 *
 * Each field contains the set of valid values for that position.
 */
export interface ICronFields {
  /** Seconds (0-59). */
  seconds?: number[];
  /** Minutes (0-59). */
  minutes: number[];
  /** Hours (0-23). */
  hours: number[];
  /** Days of month (1-31). */
  daysOfMonth: number[];
  /** Months (1-12). */
  months: number[];
  /** Days of week (0-6, Sunday=0). */
  daysOfWeek: number[];
}
