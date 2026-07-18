/**
 * @file devtools-panel-locked.interface.ts
 * @module @stackra/devtools/native/components
 * @description Props for the native {@link DevtoolsPanelLocked}
 *   state.
 */

import type { IDevtoolsAuthGate } from '@stackra/contracts';

/** Deny reason mirrored from the web guard. */
export type DevtoolsAuthDenyReason = 'unauthenticated' | 'forbidden';

/** Props for the native {@link DevtoolsPanelLocked}. */
export interface DevtoolsPanelLockedProps {
  /** The gate that denied access. */
  readonly gate: IDevtoolsAuthGate;
  /** Why access was denied. */
  readonly reason: DevtoolsAuthDenyReason;
}
