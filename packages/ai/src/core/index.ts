/**
 * @file src/core/index.ts
 * @module @stackra/ai
 * @description Public API for the platform-agnostic core of `@stackra/ai`
 *   (the `.` subpath). Services, registries, the stream decoder, the
 *   transport seam, and DI wiring live here and touch neither the DOM
 *   nor React.
 *
 *   Per the contract-reexports rule, this barrel exports ONLY symbols
 *   owned by `@stackra/ai`. Cross-package tokens/interfaces/enums/events
 *   live in `@stackra/contracts` and are imported from there directly by
 *   consumers.
 */

// ══════════════════════════════════════════════════════════════════════
// Module
// ══════════════════════════════════════════════════════════════════════
export { AiModule } from './ai.module';

// ══════════════════════════════════════════════════════════════════════
// Services
// ══════════════════════════════════════════════════════════════════════
export {
  AiClientService,
  ChatOrchestrator,
  ConnectionManager,
  ContextCollector,
  ConversationStore,
  DraftService,
  PersonaDiscovery,
  PiiRedactor,
  ToolConverter,
  ToolExecutor,
} from './services';

export type {
  IConnectionReason,
  IReconnectSchedule,
  IResumeContext,
  ConnectionStateListener,
  IContextDiagnostic,
  ICreateThreadOptions,
  IExecuteOptions,
  IExecutionOutcome,
  IOrchestratorError,
  ISendOptions,
  OrchestratorStatus,
  ToolsetListener,
} from './services';

// ══════════════════════════════════════════════════════════════════════
// Registries
// ══════════════════════════════════════════════════════════════════════
export { AgentRegistry, ContextRegistry, ToolRegistry } from './registries';
export type {
  IContextRegistration,
  IToolEntry,
  IToolRegistration,
  ToolHandler,
} from './registries';

// ══════════════════════════════════════════════════════════════════════
// Transport + Decoder
// ══════════════════════════════════════════════════════════════════════
export { SseTransport } from './transport';
export { StreamDecoder } from './decoder';

// ══════════════════════════════════════════════════════════════════════
// Decorators
// ══════════════════════════════════════════════════════════════════════
export { AiAgent, getAiAgentMetadata } from './decorators';

// ══════════════════════════════════════════════════════════════════════
// Errors (package-owned)
// ══════════════════════════════════════════════════════════════════════
export {
  AiDraftError,
  AiError,
  AiAuthError,
  AiSchemaError,
  AiToolExecutionError,
  AiTransportError,
} from './errors';

// ══════════════════════════════════════════════════════════════════════
// Utils
// ══════════════════════════════════════════════════════════════════════
export {
  base64Decode,
  base64Encode,
  computeBackoff,
  deepEqual,
  defineAiTool,
  defineConfig,
  mergeConfig,
  serializedSizeOf,
} from './utils';
export type { IAiToolDefinition, IBackoffOptions, IBackoffPolicy } from './utils';

// ══════════════════════════════════════════════════════════════════════
// Constants (package-owned only — DEFAULT_AI_CONFIG)
// ══════════════════════════════════════════════════════════════════════
export { DEFAULT_AI_CONFIG } from './constants';
