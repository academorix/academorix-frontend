/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/scope
 * @description Barrel export for the dynamic scope contract.
 */

export type { IScopeDefinition } from "./scope-definition.interface";
export type { IScopeNode } from "./scope-node.interface";
export type { IScopeValue } from "./scope-value.interface";
export type { IScopeContext } from "./scope-context.interface";
export type { IScopeIdentity } from "./scope-identity.interface";
export type { IScopeContextStore } from "./scope-context-store.interface";
export type { IScopeDefinitionTreeNode } from "./scope-definition-tree-node.interface";
export type { IScopeCache } from "./scope-cache.interface";
export type { IScopeRegistry } from "./scope-registry.interface";
export type { IScopeEmulator } from "./scope-emulator.interface";
export type { IScopeService } from "./scope-service.interface";
export type { IScopeModuleOptions } from "./scope-module-options.interface";
export type {
  ICreateScopeDefinitionInput,
  IUpdateScopeDefinitionInput,
  ICreateScopeNodeInput,
  IUpdateScopeNodeInput,
  IResolveResult,
  IEffectiveValue,
  IValueOverride,
  INodeCoverage,
  IScopeConsumerConfig,
  IScopeDefinitionSeed,
} from "./scope-types.interface";
