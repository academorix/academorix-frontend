/**
 * @file merge-config.util.ts
 * @module @stackra/analytics/core/utils
 * @description Merge user options with analytics defaults and prune
 *   provider instances that are disabled or missing a required field.
 */

import type { IAnalyticsInstanceConfig, IAnalyticsModuleOptions } from "../interfaces";
import { ANALYTICS_REQUIRED_FIELDS, DEFAULT_ANALYTICS_CONFIG } from "../constants";

/** Whether a value counts as "present" for a required field. */
function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== "";
}

/**
 * Decide whether a provider instance should be registered — dropped when
 * explicitly disabled or when a required field for its driver is missing.
 *
 * @param config - The instance config.
 * @returns `true` if the instance is active.
 */
function isInstanceActive(config: IAnalyticsInstanceConfig): boolean {
  if (config.enabled === false) return false;
  const required = ANALYTICS_REQUIRED_FIELDS[config.driver] ?? [];
  return required.every((field) => isPresent(config[field]));
}

/**
 * Merge partial options over {@link DEFAULT_ANALYTICS_CONFIG}, then prune
 * inactive instances and any `stack` entries pointing at them.
 *
 * @param options - User-supplied partial configuration.
 * @returns Fully resolved, normalised configuration.
 */
export function mergeConfig(options?: Partial<IAnalyticsModuleOptions>): IAnalyticsModuleOptions {
  const merged = { ...DEFAULT_ANALYTICS_CONFIG, ...options };

  const providers: Record<string, IAnalyticsInstanceConfig> = {};
  for (const [name, config] of Object.entries(merged.providers ?? {})) {
    if (isInstanceActive(config)) providers[name] = config;
  }

  const stack = merged.stack?.filter((name) => name in providers);

  return { ...merged, providers, ...(stack ? { stack } : {}) };
}
