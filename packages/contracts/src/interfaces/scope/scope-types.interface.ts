/**
 * @file scope-types.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Supporting types for the scope system — inputs, results,
 *   consumer configuration, and seeds.
 */

/**
 * Input for creating a new scope definition.
 */
export interface ICreateScopeDefinitionInput {
  /** URL-safe identifier (1-64 chars). */
  slug: string;

  /** Human-readable display name. */
  label: string;

  /** Parent scope definition slug (`null` = root level). */
  parent_slug?: string | null;

  /** Display ordering among siblings. */
  sort_order?: number;
}

/**
 * Input for updating an existing scope definition.
 */
export interface IUpdateScopeDefinitionInput {
  /** New human-readable label. */
  label?: string;

  /** New parent slug (`null` promotes to root). */
  parent_slug?: string | null;

  /** New sort order. */
  sort_order?: number;
}

/**
 * Input for creating a new scope node.
 */
export interface ICreateScopeNodeInput {
  /** Reference to a scope definition slug. */
  scope_slug: string;

  /** The real entity id this node represents. */
  entity_id: string;

  /** Parent node id (`null` for root nodes). */
  parent_node_id?: string | null;
}

/**
 * Input for reparenting a scope node.
 */
export interface IUpdateScopeNodeInput {
  /** New parent node id (`null` promotes to root). */
  parent_node_id: string | null;
}

/**
 * A resolved scope value with inheritance metadata.
 */
export interface IResolveResult {
  /** The resolved value. */
  value: unknown;

  /** The node that provided the value. */
  providedByNodeId: string;

  /** Whether the value came from an ancestor (`true`) or the queried node (`false`). */
  inherited: boolean;
}

/**
 * A single effective value in a namespace annotated with its origin.
 */
export interface IEffectiveValue {
  /** Consumer namespace. */
  namespace: string;

  /** Configuration key. */
  key: string;

  /** The resolved value. */
  value: unknown;

  /** The node that provided the value. */
  providedByNodeId: string;

  /** Whether the value came from an ancestor. */
  inherited: boolean;
}

/**
 * A single override of a value at some ancestor node.
 */
export interface IValueOverride {
  /** Node id where the override is set. */
  nodeId: string;

  /** Scope level slug of the node. */
  level: string;

  /** The overriding value. */
  value: unknown;
}

/**
 * Aggregate coverage of a value across every node at a scope level.
 */
export interface INodeCoverage {
  /** Scope level slug (e.g. `'venue'`). */
  level: string;

  /** Total nodes at the level. */
  totalNodes: number;

  /** Nodes with an explicit value set. */
  explicitCount: number;

  /** Nodes that inherit the value from an ancestor. */
  inheritedCount: number;
}

/**
 * Configuration for a consumer package registered via
 * `ScopeModule.forFeature(...)`.
 */
export interface IScopeConsumerConfig {
  /** Unique namespace string (1-64 chars). */
  namespace: string;

  /** Factory invoked when resolution returns null (default value provider). */
  defaultValueFactory?: (key: string) => unknown;

  /** Validator invoked before storing a value. Return `false` to reject. */
  validator?: (value: unknown) => boolean;
}

/**
 * A scope definition seed applied during bootstrap.
 */
export interface IScopeDefinitionSeed {
  /** URL-safe identifier. */
  slug: string;

  /** Human-readable display name. */
  label: string;

  /** Parent scope definition slug (`null` = root level). */
  parent_slug?: string | null;

  /** Display ordering. */
  sort_order?: number;
}
