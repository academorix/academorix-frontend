/**
 * @file pwa-snapshot.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Aggregate snapshot of every observable PWA field.
 *
 *   Returned by `PwaService.getSnapshot()` and consumed by React
 *   hooks via `useSyncExternalStore`. Referential stability is
 *   guaranteed: the service replaces this object identity only when
 *   at least one field changes.
 */

import type { IPwaAttribution, PwaDisplayMode } from './pwa-attribution.interface';
import type { IPwaInstallState } from './pwa-install-state.interface';
import type { IPwaUpdateState } from './pwa-update-state.interface';

/**
 * Referentially stable snapshot of the PWA service's observable state.
 *
 * Readers should treat every field as immutable — mutating a nested
 * object would defeat the identity check in
 * {@link IPwaService.getSnapshot}.
 */
export interface IPwaSnapshot {
  /** Install prompt state. */
  readonly install: IPwaInstallState;
  /** Service-worker update state. */
  readonly update: IPwaUpdateState;
  /** Whether the app is running in standalone mode. */
  readonly standalone: boolean;
  /** Coarse display-mode categorisation. */
  readonly displayMode: PwaDisplayMode;
  /** Best-effort install-source attribution. */
  readonly attribution: IPwaAttribution;
}
