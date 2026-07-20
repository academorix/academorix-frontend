/**
 * @file merge-config.util.ts
 * @module @stackra/consent/core/utils
 * @description Merge user consent options with defaults.
 */

import type { IConsentModuleOptions } from "../types";
import { DEFAULT_CONSENT_CONFIG } from "../constants/defaults.constant";

/**
 * Merge partial consent options over {@link DEFAULT_CONSENT_CONFIG}.
 *
 * @param options - User-supplied partial configuration.
 * @returns Fully resolved configuration.
 */
export function mergeConfig(options: Partial<IConsentModuleOptions> = {}): IConsentModuleOptions {
  return { ...DEFAULT_CONSENT_CONFIG, ...options };
}
