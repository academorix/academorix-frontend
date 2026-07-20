/**
 * @file ai.module.ts
 * @module @stackra/ai/core
 * @description The `@stackra/ai` DI module.
 *
 *   - `AiModule.forRoot(options)` — provides every AI service (client,
 *     decoder, connection manager, orchestrator, tool/context/agent
 *     subsystems, draft service, conversation store). Does NOT bind a
 *     concrete transport (`AI_TRANSPORT`) — the platform module
 *     (`WebAiModule` / `NativeAiModule`) supplies that so the SSE↔WS
 *     swap stays a one-line `useClass` change (Req 3.3, 3.5, 23.7).
 *   - `AiModule.forRootAsync(options)` — same shape with a `useFactory`
 *     for `AI_CONFIG`.
 *   - `AiModule.forFeature({ personas })` — seed additional declared
 *     personas via `createSeedLoader` (no bootstrap class, no sentinel
 *     factory — per the module-lifecycle rule).
 *
 *   Requirement traceability: 23.1–23.6, 23.7 (transport swap seam),
 *   14.2 (persona seeding via lifecycle hooks).
 */

import { Global, Module, type DynamicModule, type Provider } from "@stackra/container";
import { createSeedLoader, seedLoaderToken } from "@stackra/support";
import { DevtoolsModule } from "@stackra/devtools";
import {
  AI_AGENT_REGISTRY,
  AI_AUTH_PROVIDER,
  AI_CLIENT,
  AI_CONFIG,
  AI_CONNECTION_MANAGER,
  AI_CONTEXT_COLLECTOR,
  AI_CONTEXT_REGISTRY,
  AI_CONVERSATION_STORE,
  AI_DRAFT_SERVICE,
  AI_ORCHESTRATOR,
  AI_PII_REDACTOR,
  AI_STREAM_DECODER,
  AI_TOOL_CONVERTER,
  AI_TOOL_EXECUTOR,
  AI_TOOL_REGISTRY,
  type IAiModuleAsyncOptions,
  type IAiModuleOptions,
  type IPersona,
} from "@stackra/contracts";

import { StreamDecoder } from "./decoder/stream-decoder";
import { AgentRegistry } from "./registries/agent.registry";
import { ContextRegistry } from "./registries/context.registry";
import { ToolRegistry } from "./registries/tool.registry";
import { AiClientService } from "./services/ai-client.service";
import { ChatOrchestrator } from "./services/chat-orchestrator.service";
import { ConnectionManager } from "./services/connection-manager.service";
import { ContextCollector } from "./services/context-collector.service";
import { ConversationStore } from "./services/conversation-store.service";
import { DraftService } from "./services/draft.service";
import { PersonaDiscovery } from "./services/persona-discovery.service";
import { PiiRedactor } from "./services/pii-redactor.service";
import { ToolConverter } from "./services/tool-converter.service";
import { ToolExecutor } from "./services/tool-executor.service";
import { mergeConfig } from "./utils/merge-config.util";
import { AiDevtoolsPanel } from "../react/devtools/ai.devtools-panel";

/**
 * The `@stackra/ai` module.
 */
@Global()
@Module({})
export class AiModule {
  /**
   * Tokens re-exported alongside the class providers on the module's
   * `exports` array — consumers can inject by either token or class.
   */
  private static readonly EXPORTED_TOKENS = [
    AI_CONFIG,
    AI_AUTH_PROVIDER,
    AI_CLIENT,
    AI_STREAM_DECODER,
    AI_CONNECTION_MANAGER,
    AI_ORCHESTRATOR,
    AI_TOOL_REGISTRY,
    AI_TOOL_CONVERTER,
    AI_TOOL_EXECUTOR,
    AI_CONTEXT_REGISTRY,
    AI_CONTEXT_COLLECTOR,
    AI_PII_REDACTOR,
    AI_AGENT_REGISTRY,
    AI_DRAFT_SERVICE,
    AI_CONVERSATION_STORE,
  ] as const;

  /** Classes exported alongside their token aliases. */
  private static readonly EXPORTED_CLASSES = [
    AiClientService,
    StreamDecoder,
    ConnectionManager,
    ChatOrchestrator,
    ToolRegistry,
    ToolConverter,
    ToolExecutor,
    ContextRegistry,
    ContextCollector,
    PiiRedactor,
    AgentRegistry,
    DraftService,
    ConversationStore,
  ] as const;

  /**
   * Configure the AI module statically.
   *
   * Does NOT bind `AI_TRANSPORT` — the platform module (`WebAiModule` /
   * `NativeAiModule`) owns that binding.
   *
   * @param options - Resolved AI options (merged with defaults).
   */
  public static forRoot(options: IAiModuleOptions): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: AiModule,
      global: true,
      // Contribute the devtools AI panel. `DevtoolsModule.forFeature`
      // is fail-soft — when the consumer app hasn't wired
      // `DevtoolsModule.forRoot()` the seed loader becomes a no-op
      // and the panel doesn't appear anywhere.
      imports: [DevtoolsModule.forFeature([AiDevtoolsPanel])],
      providers: [
        { provide: AI_CONFIG, useValue: config },
        { provide: AI_AUTH_PROVIDER, useValue: config.authProvider },
        ...AiModule.buildCoreProviders(),
      ],
      exports: [...AiModule.EXPORTED_TOKENS, ...AiModule.EXPORTED_CLASSES],
    };
  }

  /**
   * Configure the AI module asynchronously.
   *
   * The factory resolves the module options; the same providers are
   * registered on top.
   */
  public static forRootAsync(options: IAiModuleAsyncOptions): DynamicModule {
    return {
      module: AiModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        // Devtools AI panel — see forRoot for the fail-soft rationale.
        DevtoolsModule.forFeature([AiDevtoolsPanel]),
      ],
      providers: [
        {
          provide: AI_CONFIG,
          useFactory: async (...args: unknown[]) => {
            const resolved = await options.useFactory(...args);
            return mergeConfig(resolved);
          },
          inject: options.inject ?? [],
        },
        {
          provide: AI_AUTH_PROVIDER,
          useFactory: (cfg: IAiModuleOptions) => cfg.authProvider,
          inject: [AI_CONFIG],
        },
        ...AiModule.buildCoreProviders(),
      ],
      exports: [...AiModule.EXPORTED_TOKENS, ...AiModule.EXPORTED_CLASSES],
    };
  }

  /**
   * Register additional client-declared personas at feature level.
   *
   * Feature seeding uses `createSeedLoader` (from `@stackra/support`)
   * with a unique `seedLoaderToken` per call so multiple feature modules
   * can all contribute under the container's last-wins token semantics.
   *
   * @param options - Feature personas + optional identifying name.
   */
  public static forFeature(options: { personas?: IPersona[]; name?: string }): DynamicModule {
    const personas = options.personas ?? [];
    const label = options.name ?? "personas";
    return {
      module: AiModule,
      providers: [
        {
          provide: seedLoaderToken(`ai:${label}`),
          useFactory: (registry: AgentRegistry) =>
            createSeedLoader(() => {
              for (const persona of personas) registry.register(persona);
            }),
          inject: [AgentRegistry],
        },
      ],
      exports: [],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /**
   * Providers common to `forRoot` and `forRootAsync` — every service
   * class plus its `useExisting` token alias.
   */
  private static buildCoreProviders(): Provider[] {
    return [
      AiClientService,
      { provide: AI_CLIENT, useExisting: AiClientService },
      StreamDecoder,
      { provide: AI_STREAM_DECODER, useExisting: StreamDecoder },
      ConnectionManager,
      { provide: AI_CONNECTION_MANAGER, useExisting: ConnectionManager },
      ChatOrchestrator,
      { provide: AI_ORCHESTRATOR, useExisting: ChatOrchestrator },
      ToolRegistry,
      { provide: AI_TOOL_REGISTRY, useExisting: ToolRegistry },
      ToolConverter,
      { provide: AI_TOOL_CONVERTER, useExisting: ToolConverter },
      ToolExecutor,
      { provide: AI_TOOL_EXECUTOR, useExisting: ToolExecutor },
      ContextRegistry,
      { provide: AI_CONTEXT_REGISTRY, useExisting: ContextRegistry },
      ContextCollector,
      { provide: AI_CONTEXT_COLLECTOR, useExisting: ContextCollector },
      PiiRedactor,
      { provide: AI_PII_REDACTOR, useExisting: PiiRedactor },
      AgentRegistry,
      { provide: AI_AGENT_REGISTRY, useExisting: AgentRegistry },
      // `PersonaDiscovery` is internal — no token alias; it runs via
      // `OnApplicationBootstrap` after the container wires everything.
      PersonaDiscovery,
      DraftService,
      { provide: AI_DRAFT_SERVICE, useExisting: DraftService },
      ConversationStore,
      { provide: AI_CONVERSATION_STORE, useExisting: ConversationStore },
    ];
  }
}
