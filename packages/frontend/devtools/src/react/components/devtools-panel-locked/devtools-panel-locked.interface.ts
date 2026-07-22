/**
 * @file devtools-panel-locked.interface.ts
 * @module @stackra/devtools/react/components
 * @description Props for the {@link DevtoolsPanelLocked} state.
 */

import type { IDevtoolsAuthGate } from "@stackra/contracts";

import type { DevtoolsAuthDenyReason } from "../../hooks/use-devtools-auth-guard";

/**
 * Props accepted by {@link DevtoolsPanelLocked}.
 */
export interface DevtoolsPanelLockedProps {
  /** The gate that denied access. */
  readonly gate: IDevtoolsAuthGate;
  /** Why access was denied. */
  readonly reason: DevtoolsAuthDenyReason;
}
