/**
 * @file create-mock-scope.ts
 * @module @stackra/scope/testing
 * @description Factories returning assertable mock scope instances.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockScopeService } from "./mock-scope-service";
import { MockScopeDataSource } from "./mock-scope-data-source";
import type { IScopeContext, IScopeNodeTreeNode } from "../core/interfaces";

/** Options accepted by {@link createMockScopeService}. */
export interface CreateMockScopeServiceOptions {
  /** Seed active scope. */
  scope?: IScopeContext | null;
  /** Seed node tree. */
  tree?: readonly IScopeNodeTreeNode[];
  /** Seed loading flag. */
  loading?: boolean;
  /** Custom scope resolver used by `setScope` / `emulate`. */
  resolveScope?: (nodeId: string) => IScopeContext | null;
  /** Custom value resolver used by `resolveValue`. */
  resolveValue?: (nodeId: string, ns: string, key: string) => unknown;
}

/** Options accepted by {@link createMockScopeDataSource}. */
export interface CreateMockScopeDataSourceOptions {
  /** Map of node id → context returned by `resolveScope`. */
  scopes?: Record<string, IScopeContext>;
  /** Node tree returned by `loadTree`. */
  tree?: readonly IScopeNodeTreeNode[];
  /** Pre-seeded cascading values, keyed by `${nodeId}:${namespace}:${key}`. */
  values?: Record<string, unknown>;
}

/**
 * Create an assertable mock scope service.
 *
 * @example
 * ```ts
 * const service = createMockScopeService({
 *   scope: {
 *     ownerId: 'owner-1',
 *     nodeId: 'n-venue',
 *     level: 'venue',
 *     entityId: 'venue-1',
 *     path: ['n-venue'],
 *     ancestors: { venue: 'venue-1' },
 *   },
 * });
 * expect(service.getScope()?.entityId).toBe('venue-1');
 * expect(service.$.wasCalled('getScope')).toBe(true);
 * ```
 */
export function createMockScopeService(
  options: CreateMockScopeServiceOptions = {},
): AssertableProxy<MockScopeService> {
  return createAssertableProxy(new MockScopeService(options));
}

/**
 * Create an assertable mock scope data source.
 *
 * @example
 * ```ts
 * const source = createMockScopeDataSource({
 *   scopes: { 'n-venue': fixtureContext },
 *   tree: [{ id: 'n-owner', ownerId: 'o-1', level: 'owner',
 *            entityId: 'o-1', label: 'Acme', children: [] }],
 * });
 * expect(source.$.wasCalledWith('resolveScope', 'n-venue')).toBe(false);
 * await source.resolveScope('n-venue');
 * expect(source.$.wasCalledWith('resolveScope', 'n-venue')).toBe(true);
 * ```
 */
export function createMockScopeDataSource(
  options: CreateMockScopeDataSourceOptions = {},
): AssertableProxy<MockScopeDataSource> {
  return createAssertableProxy(new MockScopeDataSource(options));
}
