/**
 * @file index.ts
 * @module @stackra/monitoring/core/constants
 * @description Defaults for the monitoring module.
 */

import type { IMonitoringModuleOptions } from '../interfaces';

/** Default monitoring configuration — a single console instance. */
export const DEFAULT_MONITORING_CONFIG: IMonitoringModuleOptions = {
  default: 'console',
  providers: {
    console: { driver: 'console' },
  },
};

/**
 * Required config fields per built-in driver. An instance whose required
 * field is missing/empty is pruned by `mergeConfig` — so consumers can wire
 * `dsn: import.meta.env.VITE_SENTRY_DSN` unconditionally and let the module
 * skip it when unset. Custom drivers have no entry ⇒ never pruned for
 * missing fields (only by `enabled: false`).
 */
export const MONITORING_REQUIRED_FIELDS: Record<string, string[]> = {
  sentry: ['dsn'],
};
