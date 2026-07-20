/**
 * @file index.ts
 * @module @stackra/ai/core/services
 * @description Barrel export for `@stackra/ai` core services.
 */

export { ConnectionManager } from './connection-manager.service';
export type {
  IConnectionReason,
  IResumeContext,
  IReconnectSchedule,
  ConnectionStateListener,
} from './connection-manager.service';

export { AiClientService } from './ai-client.service';

export { ToolConverter } from './tool-converter.service';
export type { ToolsetListener } from './tool-converter.service';

export { ToolExecutor } from './tool-executor.service';
export type { IExecutionOutcome, IExecuteOptions } from './tool-executor.service';

export { PiiRedactor } from './pii-redactor.service';

export { ContextCollector } from './context-collector.service';
export type { IContextDiagnostic } from './context-collector.service';

export { PersonaDiscovery } from './persona-discovery.service';

export { DraftService } from './draft.service';

export { ConversationStore } from './conversation-store.service';
export type { ICreateThreadOptions } from './conversation-store.service';

export { ChatOrchestrator } from './chat-orchestrator.service';
export type {
  ISendOptions,
  OrchestratorStatus,
  IOrchestratorError,
} from './chat-orchestrator.service';
