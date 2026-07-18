/**
 * @file scope.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by the scope system.
 */

/**
 * Scope system lifecycle and operational event names.
 *
 * Emitted by `ScopeService` on the shared event bus. Consumer packages
 * subscribe to react in real time — invalidate caches, push updates to
 * clients, trigger recalculations.
 */
export const SCOPE_EVENTS = {
  // Value events
  /** A scope value was created. Payload: `{ owner_id, scope_node_id, namespace, key, value }`. */
  VALUE_CREATED: "scope.value.created",
  /** A scope value was updated. Payload: `{ owner_id, scope_node_id, namespace, key, previous, value }`. */
  VALUE_UPDATED: "scope.value.updated",
  /** A scope value was deleted. Payload: `{ owner_id, scope_node_id, namespace, key }`. */
  VALUE_DELETED: "scope.value.deleted",
  /** A bulk value operation completed. Payload: `{ owner_id, namespace, key, affected_count, operation }`. */
  VALUE_BULK_CHANGED: "scope.value.bulk_changed",

  // Node events
  /** A scope node was created. Payload: `{ owner_id, scope_slug, entity_id, parent_node_id }`. */
  NODE_CREATED: "scope.node.created",
  /** A scope node was reparented. Payload: `{ owner_id, node_id, previous_parent_id, new_parent_id }`. */
  NODE_REPARENTED: "scope.node.reparented",
  /** A scope node was deleted. Payload: `{ owner_id, node_id, scope_slug, entity_id }`. */
  NODE_DELETED: "scope.node.deleted",

  // Definition events
  /** A scope definition was created, updated, or deleted. Payload: `{ owner_id, slug, action }`. */
  DEFINITION_CHANGED: "scope.definition.changed",

  // Alias events
  /** A scope alias was created or updated. Payload: `{ owner_id, scope_slug, alias_label, action }`. */
  ALIAS_CHANGED: "scope.alias.changed",

  // Context events
  /** The active scope context was switched. Payload: `{ owner_id, previous_node_id, new_node_id, level }`. */
  CONTEXT_SWITCHED: "scope.context.switched",

  // Emulation events
  /** Scope emulation started. Payload: `{ owner_id, original_node_id, emulated_node_id, emulated_level }`. */
  EMULATION_STARTED: "scope.emulation.started",
  /** Scope emulation ended. Payload: `{ owner_id, original_node_id, emulated_node_id, duration_ms }`. */
  EMULATION_ENDED: "scope.emulation.ended",
} as const;

/** Union type of every emitted scope event name. */
export type ScopeEventName = (typeof SCOPE_EVENTS)[keyof typeof SCOPE_EVENTS];
