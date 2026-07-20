/**
 * @file use-storage-value.interface.ts
 * @module @stackra/storage/react/hooks/use-storage-value
 * @description Family interfaces owned by the `useStorageValue`
 *   hook — the options bag it accepts and the tuple result it
 *   returns.
 */

/**
 * Options bag accepted by `useStorageValue(key, options?)`.
 */
export interface UseStorageValueOptions<T> {
  /**
   * Named `IStorage` instance to read/write against. Defaults to
   * the manager's configured default instance.
   */
  readonly instance?: string;

  /**
   * Value returned while the initial read is in flight (and when the
   * key is absent). Defaults to `null`.
   */
  readonly initialValue?: T | null;

  /**
   * Optional TTL (seconds) applied to every write the setter
   * performs. When omitted, writes have no expiration.
   */
  readonly ttlSeconds?: number;
}

/**
 * Meta info surfaced alongside the current value + setter.
 */
export interface UseStorageValueMeta {
  /** `true` while the initial read is in flight. */
  readonly isLoading: boolean;

  /**
   * Non-`null` when the most recent read/write threw. Reads and
   * writes fail-soft at the driver layer so this is rare, but it's
   * exposed for callers that want to surface issues to the UI.
   */
  readonly error: Error | null;
}

/**
 * Tuple returned by `useStorageValue`.
 *
 * `[value, setValue, meta]` — same shape as `useState` with a
 * trailing metadata object.
 */
export type UseStorageValueResult<T> = readonly [
  T | null,
  (value: T | null) => void,
  UseStorageValueMeta,
];
