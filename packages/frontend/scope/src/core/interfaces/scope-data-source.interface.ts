/**
 * @file scope-data-source.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description Bridge between the client `ScopeService` and your backend.
 *
 *   The client never computes scope — it asks the backend. The app
 *   implements this interface (hitting its own API) and registers it
 *   under `SCOPE_DATA_SOURCE`. The `ScopeService` calls it to resolve
 *   contexts, load the tree of nodes the current user can switch to,
 *   resolve cascading values, and persist the active selection.
 */

import type { IScopeContext } from './scope-context.interface';
import type { IScopeNodeTreeNode } from './scope-node-tree-node.interface';

/**
 * App-provided data source for the client scope runtime.
 *
 * Every method is invoked from the singleton `ScopeService`. The
 * implementation is expected to hit the app's authenticated API, apply
 * whatever authorisation the backend enforces, and return the
 * client-shaped values above. It MUST NOT hold any per-request state
 * — the DI singleton nature of the service handles caching.
 */
export interface IScopeDataSource {
  /**
   * Resolve a full scope context for a node id. The backend validates
   * the caller may access (or emulate) the node and returns the
   * resolved context (path, ancestors, ...), or `null` if not permitted
   * / unknown.
   */
  resolveScope(nodeId: string): Promise<IScopeContext | null>;

  /**
   * Load the tree of scope *nodes* (instances — this venue, that team)
   * the current user can switch to. Called once on service init when
   * no seed tree is provided; may be called again by callers that want
   * to refresh (e.g., after a mutation elsewhere).
   */
  loadTree(): Promise<IScopeNodeTreeNode[]>;

  /**
   * Resolve a cascading value for the active node + consumer namespace.
   * Optional — only needed if you use `useScopeValue`.
   */
  resolveValue?<T = unknown>(nodeId: string, namespace: string, key: string): Promise<T | null>;

  /**
   * Persist the active scope selection (e.g. localStorage, cookie,
   * remote user prefs) so the next paint reopens on the same node.
   * Optional; called on every successful `setScope`.
   */
  persist?(scope: IScopeContext): void;
}
