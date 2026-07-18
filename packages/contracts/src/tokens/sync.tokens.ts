/**
 * @file sync.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the offline-first sync subsystem.
 *
 *   Tokens live in contracts so cross-package consumers (sdui, ai, custom
 *   modules) can inject the sync engine and its collaborators without
 *   pulling in the `@stackra/sync` runtime.
 *
 *   NOTE: `NETWORK_DETECTOR` is owned by the network subsystem and lives in
 *   `network.tokens.ts` — sync consumes it but does not own it.
 */

/** Token for the merged sync configuration ({@link ISyncConfig}). */
export const SYNC_CONFIG = Symbol.for("SYNC_CONFIG");

/** Token for the top-level sync orchestrator (`SyncEngine`). */
export const SYNC_ENGINE = Symbol.for("SYNC_ENGINE");

/** Token for the cursor-based pull service. */
export const PULL_SERVICE = Symbol.for("PULL_SERVICE");

/** Token for the batched push service. */
export const PUSH_SERVICE = Symbol.for("PUSH_SERVICE");

/** Token for the merge service that lands pulled data into the local store. */
export const MERGE_SERVICE = Symbol.for("MERGE_SERVICE");

/** Token for the offline operation queue. */
export const OPERATION_QUEUE = Symbol.for("OPERATION_QUEUE");

/** Token for the pluggable conflict resolver. */
export const CONFLICT_RESOLVER = Symbol.for("CONFLICT_RESOLVER");

/** Token for the consumer-supplied local storage adapter ({@link ILocalStorageAdapter}). */
export const LOCAL_STORAGE_ADAPTER = Symbol.for("LOCAL_STORAGE_ADAPTER");

/** Token for the checkpoint persistence service. */
export const CHECKPOINT_SERVICE = Symbol.for("CHECKPOINT_SERVICE");

/** Token for the conflict-resolver configuration slice. */
export const CONFLICT_RESOLVER_CONFIG = Symbol.for("CONFLICT_RESOLVER_CONFIG");

/** Token for the network-detector configuration slice. */
export const NETWORK_DETECTOR_CONFIG = Symbol.for("NETWORK_DETECTOR_CONFIG");

/** Token for the operation-queue configuration slice. */
export const OPERATION_QUEUE_CONFIG = Symbol.for("OPERATION_QUEUE_CONFIG");
