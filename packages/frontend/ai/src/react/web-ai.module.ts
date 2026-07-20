/**
 * @file web-ai.module.ts
 * @module @stackra/ai/react
 * @description Web platform binding for `@stackra/ai`.
 *
 *   Imports `AiModule.forRoot(...)` and binds the concrete transport
 *   (`SseTransport`) under `AI_TRANSPORT`. Swapping SSE for WebSocket in
 *   the future is a one-line `useClass` change here — hook and component
 *   code stays untouched (Requirement 3.3, 3.5, 23.7).
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { AI_TRANSPORT, type IAiModuleOptions } from "@stackra/contracts";

import { AiModule } from "@/core/ai.module";
import { SseTransport } from "@/core/transport/sse.transport";

/**
 * The web-platform AI module.
 *
 * `@Global()` so the `AI_TRANSPORT` binding is visible to
 * `AiClientService` (which lives inside the global `AiModule`) — that's
 * the point of the seam.
 */
@Global()
@Module({})
export class WebAiModule {
  /**
   * Bind the web AI stack — core `AiModule` + `SseTransport` under
   * `AI_TRANSPORT`.
   */
  public static forRoot(options: IAiModuleOptions): DynamicModule {
    return {
      module: WebAiModule,
      imports: [AiModule.forRoot(options)],
      providers: [SseTransport, { provide: AI_TRANSPORT, useExisting: SseTransport }],
      exports: [AI_TRANSPORT, SseTransport],
    };
  }
}
