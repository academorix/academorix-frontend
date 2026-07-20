/**
 * @file merge-config.util.ts
 * @module @stackra/ai/core/utils
 * @description Single source of truth for merging user-supplied AI options
 *   with {@link DEFAULT_AI_CONFIG}. Both `AiModule.forRoot()` and
 *   `AiModule.forRootAsync()` route through this helper so defaults stay
 *   consistent. Nested `context`/`retryPolicy`/`speech` objects are merged,
 *   not shallow-clobbered.
 */

import type { IAiModuleOptions } from '@stackra/contracts';
import { DEFAULT_AI_CONFIG } from '@/core/constants/default-ai-config.constant';

/**
 * Merge user options into {@link DEFAULT_AI_CONFIG}.
 *
 * Defaults are spread *under* the user options. The nested `context`,
 * `retryPolicy`, and `speech` objects are deep-merged (a user overriding one
 * field of `context` keeps the remaining defaults), while required fields
 * supplied by the user (`baseUrl`, `authProvider`) always win.
 *
 * @param options - User-supplied partial configuration.
 * @returns Resolved AI configuration with defaults applied.
 */
export function mergeConfig(options: Partial<IAiModuleOptions> = {}): IAiModuleOptions {
  return {
    ...DEFAULT_AI_CONFIG,
    ...options,
    context: {
      ...DEFAULT_AI_CONFIG.context,
      ...options.context,
    },
    retryPolicy: {
      ...DEFAULT_AI_CONFIG.retryPolicy,
      ...options.retryPolicy,
    },
    speech: {
      ...DEFAULT_AI_CONFIG.speech,
      ...options.speech,
    },
  } as IAiModuleOptions;
}
