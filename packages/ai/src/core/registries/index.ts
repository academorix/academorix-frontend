/**
 * @file index.ts
 * @module @stackra/ai/core/registries
 * @description Barrel export for `@stackra/ai` core registries.
 */

export { ToolRegistry } from './tool.registry';
export type { IToolEntry, IToolRegistration, ToolHandler } from './tool.registry';

export { ContextRegistry } from './context.registry';
export type { IContextRegistration } from './context.registry';

export { AgentRegistry } from './agent.registry';
