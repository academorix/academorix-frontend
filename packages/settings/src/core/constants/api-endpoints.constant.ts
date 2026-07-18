/**
 * @file api-endpoints.constant.ts
 * @module @stackra/settings/core/constants
 * @description Default REST endpoint paths for the settings API.
 *
 *   Values match the Laravel Spatie controller shape by default —
 *   apps that host settings under a different route override these
 *   through `ISettingsApiOptions.endpoints`.
 *
 *   Placeholder syntax: `{group}` is substituted with the settings
 *   group key by `build-endpoint-uri.util.ts`.
 */

import type { ISettingsApiEndpoints } from '@stackra/contracts';

/** Default REST endpoint paths for the settings API. */
export const DEFAULT_API_ENDPOINTS: Required<ISettingsApiEndpoints> = {
  /** Full schema for every group. */
  schema: '/api/v1/settings/schema',
  /** Every group with resolved values. */
  listGroups: '/api/v1/settings',
  /** A single group's resolved values. */
  getGroup: '/api/v1/settings/{group}',
  /** Update a single group's values (partial merge). */
  updateGroup: '/api/v1/settings/{group}',
};
