/**
 * @file connectivity-check.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A caller-supplied connectivity probe function.
 */

/**
 * A caller-supplied connectivity check.
 *
 * Returns `true` when the device can actually reach the sync backend, `false`
 * otherwise. Layered on top of the platform's `navigator.onLine` because that
 * signal is unreliable — a phone connected to a Wi-Fi network without
 * internet still reports `online: true`.
 */
export type IConnectivityCheck = () => Promise<boolean>;
