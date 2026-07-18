/**
 * @file scope-service.interface.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Public contract for the scope service — CRUD, resolution,
 *   bulk ops, and inheritance visualization for the dynamic scope system.
 */

import type { IScopeDefinition } from "./scope-definition.interface";
import type { IScopeNode } from "./scope-node.interface";
import type { IScopeValue } from "./scope-value.interface";
import type { IScopeDefinitionTreeNode } from "./scope-definition-tree-node.interface";
import type {
  ICreateScopeDefinitionInput,
  IUpdateScopeDefinitionInput,
  ICreateScopeNodeInput,
  IUpdateScopeNodeInput,
  IResolveResult,
  IEffectiveValue,
  IValueOverride,
  INodeCoverage,
} from "./scope-types.interface";

/**
 * Scope service contract.
 *
 * Provides every operation for managing scope definitions, nodes, values,
 * cascading resolution, bulk operations, and inheritance visualization.
 */
export interface IScopeService {
  // ── Definition CRUD ──────────────────────────────────────────────────

  /** Create a new scope definition for a tenant. */
  createDefinition(ownerId: string, input: ICreateScopeDefinitionInput): Promise<IScopeDefinition>;

  /** Update an existing scope definition. */
  updateDefinition(
    ownerId: string,
    slug: string,
    input: IUpdateScopeDefinitionInput,
  ): Promise<IScopeDefinition>;

  /** Soft-delete a scope definition. */
  deleteDefinition(ownerId: string, slug: string): Promise<void>;

  /** List every active scope definition for a tenant. */
  listDefinitions(ownerId: string): Promise<IScopeDefinition[]>;

  /** Get the full hierarchical tree of scope definitions. */
  getDefinitionTree(ownerId: string): Promise<IScopeDefinitionTreeNode[]>;

  // ── Node management ──────────────────────────────────────────────────

  /** Create a new scope node linking an entity into the tree. */
  createNode(ownerId: string, input: ICreateScopeNodeInput): Promise<IScopeNode>;

  /** Reparent a scope node. */
  updateNode(nodeId: string, input: IUpdateScopeNodeInput): Promise<IScopeNode>;

  /**
   * Soft-delete a scope node.
   *
   * @param strategy - `'orphan'` (children become roots) or `'cascade'`
   *   (delete children too).
   */
  deleteNode(nodeId: string, strategy: "orphan" | "cascade"): Promise<void>;

  /** Get a scope node by id. */
  getNode(nodeId: string): Promise<IScopeNode>;

  /** Find a scope node by entity reference. */
  getNodeByEntity(ownerId: string, scopeSlug: string, entityId: string): Promise<IScopeNode | null>;

  /** List direct children of a node. */
  listChildren(nodeId: string): Promise<IScopeNode[]>;

  /** Get every ancestor from a node up to the root. */
  getAncestors(nodeId: string): Promise<IScopeNode[]>;

  // ── Value storage ────────────────────────────────────────────────────

  /** Store a value at a scope node (upsert). */
  setValue(nodeId: string, namespace: string, key: string, value: unknown): Promise<IScopeValue>;

  /** Get a value stored at a specific node (no cascading). */
  getValue(nodeId: string, namespace: string, key: string): Promise<unknown | null>;

  /** Delete a value at a specific node. */
  deleteValue(nodeId: string, namespace: string, key: string): Promise<void>;

  /** List every value at a node for a namespace. */
  listValues(nodeId: string, namespace: string): Promise<IScopeValue[]>;

  /** Store multiple values at a node in a single transaction. */
  bulkSetValues(nodeId: string, namespace: string, values: Record<string, unknown>): Promise<void>;

  // ── Cascading resolution ─────────────────────────────────────────────

  /** Resolve a value by walking up the scope tree. */
  resolve(nodeId: string, namespace: string, key: string): Promise<unknown | null>;

  /** Resolve with full inheritance metadata. */
  resolveWithInheritance(
    nodeId: string,
    namespace: string,
    key: string,
  ): Promise<IResolveResult | null>;

  /** Resolve every key for a namespace by merging ancestor values. */
  resolveAll(nodeId: string, namespace: string): Promise<Record<string, unknown>>;

  /** Resolve multiple keys at once. */
  resolveMany(
    nodeId: string,
    namespace: string,
    keys: readonly string[],
  ): Promise<Record<string, unknown | null>>;

  // ── Bulk operations ──────────────────────────────────────────────────

  /** Set a value at every direct child of a node. */
  bulkSetForDescendants(
    nodeId: string,
    namespace: string,
    key: string,
    value: unknown,
  ): Promise<number>;

  /** Set a value at every node of a specific scope level. */
  bulkSetForLevel(
    ownerId: string,
    scopeSlug: string,
    namespace: string,
    key: string,
    value: unknown,
  ): Promise<number>;

  /** Delete a value from every direct child of a node. */
  bulkDeleteForDescendants(nodeId: string, namespace: string, key: string): Promise<number>;

  // ── Inheritance visualization ────────────────────────────────────────

  /** Get every resolved value for a namespace with inheritance annotations. */
  getEffectiveValues(nodeId: string, namespace: string): Promise<IEffectiveValue[]>;

  /** Get the value at each ancestor where it's explicitly set. */
  getValueOverrides(nodeId: string, namespace: string, key: string): Promise<IValueOverride[]>;

  /** Get coverage summary (explicit vs. inherited) per scope level. */
  getNodeCoverage(ownerId: string, namespace: string, key: string): Promise<INodeCoverage[]>;
}
