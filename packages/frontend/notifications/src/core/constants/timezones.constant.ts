/**
 * @file timezones.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Default IANA timezone list surfaced by the
 *   quiet-hours picker.
 *
 *   Intentionally short — the current tenants ship to Europe, MENA,
 *   and East Africa. Consumers who need a wider set pass their own
 *   list through the `<QuietHoursPicker>` `timezones` prop.
 */

/**
 * The zones we ship as first-class options.
 */
export const DEFAULT_TIMEZONES: readonly string[] = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Africa/Cairo",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "America/New_York",
];
