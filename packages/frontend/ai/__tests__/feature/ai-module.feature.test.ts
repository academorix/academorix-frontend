/**
 * @file ai-module.feature.test.ts
 * @description Feature test for the DI wiring.
 *
 *   Verifies:
 *
 *   1. `WebAiModule.forRoot()` binds every AI token to a resolvable
 *      provider (including `AI_TRANSPORT` → `SseTransport`).
 *   2. `AiModule.forFeature({ personas })` seeds personas into the
 *      `AgentRegistry` via `createSeedLoader` (no bootstrap class, no
 *      sentinel factory).
 *   3. **Transport swap guarantee** — replacing the `AI_TRANSPORT`
 *      binding with a custom transport does not require any change to
 *      hooks, orchestrator, client, or components (Req 3.3, 23.7).
 */

import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { ApplicationFactory, Injectable, Module, type DynamicModule } from "@stackra/container";
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
  AI_TRANSPORT,
  AiConnectionState,
  HTTP_MANAGER,
  type IAiChatRequest,
  type IAiConfig,
  type IAiCredentials,
  type IAiRequestSpec,
  type IAiTransport,
  type IHttpClient,
  type IHttpManager,
} from "@stackra/contracts";

import { AiModule } from "@/core/ai.module";
import { AiClientService } from "@/core/services/ai-client.service";
import { ChatOrchestrator } from "@/core/services/chat-orchestrator.service";
import { ConnectionManager } from "@/core/services/connection-manager.service";
import { ContextCollector } from "@/core/services/context-collector.service";
import { ConversationStore } from "@/core/services/conversation-store.service";
import { DraftService } from "@/core/services/draft.service";
import { PiiRedactor } from "@/core/services/pii-redactor.service";
import { ToolConverter } from "@/core/services/tool-converter.service";
import { ToolExecutor } from "@/core/services/tool-executor.service";
import { StreamDecoder } from "@/core/decoder/stream-decoder";
import { SseTransport } from "@/core/transport/sse.transport";
import { AgentRegistry } from "@/core/registries/agent.registry";
import { ContextRegistry } from "@/core/registries/context.registry";
import { ToolRegistry } from "@/core/registries/tool.registry";
import { WebAiModule } from "@/react/web-ai.module";

// ── Fixtures ─────────────────────────────────────────────────────────────

/** Minimal HTTP manager stub sufficient for the SseTransport to instantiate. */
@Injectable()
class StubHttpManager implements IHttpManager {
  public connection(): Promise<IHttpClient> {
    return Promise.resolve({} as IHttpClient);
  }
  public forgetConnection(): void {}
  public purge(): void {}
  public addConnection(): boolean {
    return false;
  }
  public getMiddlewareRegistry(): Promise<never> {
    throw new Error("stub");
  }
  public getInterceptorRegistry(): Promise<never> {
    throw new Error("stub");
  }
  public getConnectionNames(): string[] {
    return [];
  }
  public getDefaultConnectionName(): string {
    return "default";
  }
  public setDefaultConnectionName(): void {}
  public isConnectionActive(): boolean {
    return false;
  }
  public getActiveConnectionNames(): string[] {
    return [];
  }
  public createClientFromConnector(): IHttpClient {
    return {} as IHttpClient;
  }
  public extend(): void {}
}

import { Global } from "@stackra/container";

@Global()
@Module({
  providers: [{ provide: HTTP_MANAGER, useClass: StubHttpManager }],
  exports: [HTTP_MANAGER],
})
class StubHttpModule {}

const authProvider = {
  getCredentials: (): Promise<IAiCredentials> => Promise.resolve({ headers: {} }),
  refresh: (): Promise<IAiCredentials> => Promise.resolve({ headers: {} }),
};

const options = { baseUrl: "https://api.example.com", authProvider };

// ── Tests ────────────────────────────────────────────────────────────────

describe("WebAiModule — token bindings", () => {
  it("binds every AI service to both its class and its DI token", async () => {
    @Module({ imports: [StubHttpModule, WebAiModule.forRoot(options)] })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);

    // Config + auth are useValue providers.
    expect(app.get<IAiConfig>(AI_CONFIG).baseUrl).toBe("https://api.example.com");
    expect(app.get(AI_AUTH_PROVIDER)).toBe(authProvider);

    // Each service resolves through both channels — token AND class.
    const pairs: Array<[symbol, unknown]> = [
      [AI_CLIENT, AiClientService],
      [AI_STREAM_DECODER, StreamDecoder],
      [AI_CONNECTION_MANAGER, ConnectionManager],
      [AI_ORCHESTRATOR, ChatOrchestrator],
      [AI_TOOL_REGISTRY, ToolRegistry],
      [AI_TOOL_CONVERTER, ToolConverter],
      [AI_TOOL_EXECUTOR, ToolExecutor],
      [AI_CONTEXT_REGISTRY, ContextRegistry],
      [AI_CONTEXT_COLLECTOR, ContextCollector],
      [AI_PII_REDACTOR, PiiRedactor],
      [AI_AGENT_REGISTRY, AgentRegistry],
      [AI_DRAFT_SERVICE, DraftService],
      [AI_CONVERSATION_STORE, ConversationStore],
    ];

    for (const [token, cls] of pairs) {
      const viaToken = app.get(token);
      const viaClass = app.get(cls as never);
      expect(viaToken).toBe(viaClass);
    }

    await app.close();
  });

  it("binds AI_TRANSPORT to SseTransport in the web platform module", async () => {
    @Module({ imports: [StubHttpModule, WebAiModule.forRoot(options)] })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);
    const transport = app.get<IAiTransport>(AI_TRANSPORT);
    expect(transport).toBeInstanceOf(SseTransport);
    expect(transport.state).toBe(AiConnectionState.Disconnected);
    await app.close();
  });
});

describe("AiModule.forFeature — persona seeding via createSeedLoader", () => {
  it("seeds forFeature personas into the AgentRegistry at bootstrap", async () => {
    @Module({
      imports: [
        StubHttpModule,
        WebAiModule.forRoot(options),
        AiModule.forFeature({
          personas: [
            { slug: "analyst", title: "Analyst" },
            { slug: "coach", title: "Coach" },
          ],
        }),
      ],
    })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);
    const registry = app.get(AgentRegistry);
    expect(registry.get("analyst")?.title).toBe("Analyst");
    expect(registry.get("coach")?.title).toBe("Coach");
    await app.close();
  });
});

describe("Transport swap guarantee (Req 3.3, 23.7)", () => {
  it("swaps the AI_TRANSPORT binding without changing orchestrator / client code", async () => {
    // A completely custom transport — implements IAiTransport differently
    // (in-memory, no HTTP required). The AI stack keeps working because
    // consumers only depend on the interface.
    @Injectable()
    class FakeTransport implements IAiTransport {
      public state: AiConnectionState = AiConnectionState.Connected;
      public onStateChange(): () => void {
        return () => undefined;
      }
      public stream(_req: IAiChatRequest): AsyncIterable<string> {
        async function* iter(): AsyncIterable<string> {
          /* nothing */
        }
        return iter();
      }
      public request<T>(_spec: IAiRequestSpec): Promise<T> {
        return Promise.resolve(undefined as unknown as T);
      }
    }

    /**
     * A custom platform module that imports the core AiModule and binds
     * a fake transport — mirrors the SSE→WS swap: only this binding
     * changes.
     */
    @Global()
    @Module({})
    class CustomAiModule {
      public static forRoot(): DynamicModule {
        return {
          module: CustomAiModule,
          global: true,
          imports: [AiModule.forRoot(options)],
          providers: [FakeTransport, { provide: AI_TRANSPORT, useExisting: FakeTransport }],
          exports: [AI_TRANSPORT],
        };
      }
    }

    @Module({ imports: [CustomAiModule.forRoot()] })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);

    // The AI_CLIENT/AI_ORCHESTRATOR resolve — they got FakeTransport
    // without any orchestrator source change.
    const transport = app.get<IAiTransport>(AI_TRANSPORT);
    expect(transport).toBeInstanceOf(FakeTransport);
    expect(app.get(AI_CLIENT)).toBeInstanceOf(AiClientService);
    expect(app.get(AI_ORCHESTRATOR)).toBeInstanceOf(ChatOrchestrator);

    await app.close();
  });
});
