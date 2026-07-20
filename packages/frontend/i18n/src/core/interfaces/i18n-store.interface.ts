/**
 * @file i18n-store.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description II18nStore interface.
 */

/**
 * Minimal store interface matching @stackra/react-state's Store API.
 * Allows the service to update state without depending on the full package.
 */
import type { II18nState } from './i18n-state.interface';

export interface II18nStore {
  /** Get the current state snapshot. */
  getState(): II18nState;
  /** Update state with a partial update or updater function. */
  setState(updater: Partial<II18nState> | ((prev: II18nState) => II18nState)): void;
}
