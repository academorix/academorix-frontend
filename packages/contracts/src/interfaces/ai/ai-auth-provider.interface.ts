/**
 * @file ai-auth-provider.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Consumer-supplied provider yielding and refreshing the
 *   credentials attached to backend AI requests and transport connections.
 */

import type { IAiCredentials } from "./ai-credentials.interface";

/**
 * Yields and refreshes AI backend credentials.
 *
 * Configured at module setup. `getCredentials` runs per request/connection;
 * `refresh` is called once on a 401 mid-session before a single retry.
 */
export interface IAiAuthProvider {
  /** Resolve the current credentials. */
  getCredentials(): Promise<IAiCredentials>;
  /** Refresh credentials after an authentication failure. */
  refresh(): Promise<IAiCredentials>;
}
