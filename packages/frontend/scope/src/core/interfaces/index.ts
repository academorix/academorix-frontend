/**
 * @file index.ts
 * @module @stackra/scope/core/interfaces
 * @description Barrel export for the core scope interfaces.
 */

export type { IScopeContext, IScopeIdentity } from './scope-context.interface';
export type { IScopeNode } from './scope-node.interface';
export type { IScopeDefinition, IScopeDefinitionTreeNode } from './scope-definition.interface';
export type { IScopeNodeTreeNode } from './scope-node-tree-node.interface';
export type { IScopeSnapshot } from './scope-snapshot.interface';
export type { IScopeModuleOptions } from './scope-module-options.interface';
export type { IScopeDataSource } from './scope-data-source.interface';
export type { IScopePersistAdapter } from './scope-persist-adapter.interface';
