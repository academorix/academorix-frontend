/**
 * @file native-ai.module.ts
 * @module @stackra/ai/native
 * @description React Native platform binding for `@stackra/ai`.
 *
 *   Structurally identical to `WebAiModule` — imports `AiModule.forRoot`
 *   and binds `SseTransport` under `AI_TRANSPORT`. The transport works
 *   over React Native's `fetch` streaming, so no RN-specific transport
 *   variant is needed at v1. Swapping to a WebSocket transport is the
 *   same one-line `useClass` change (Requirement 3.3, 3.5, 21).
 */

import { Global, Module, type DynamicModule } from "@stackra/container";
import { AI_TRANSPORT, type IAiModuleOptions } from "@stackra/contracts";

import { AiModule } from "@/core/ai.module";
import { SseTransport } from "@/core/transport/sse.transport";

/**
 * The React Native AI module.
 *
 * `@Global()` so the `AI_TRANSPORT` binding is visible to
 * `AiClientService` (which lives inside the global `AiModule`).
 */
@Global()
@Module({})
export class NativeAiModule {
  /**
   * Bind the native AI stack — core `AiModule` + `SseTransport` under
   * `AI_TRANSPORT`.
   */
  public static forRoot(options: IAiModuleOptions): DynamicModule {
    return {
      module: NativeAiModule,
      imports: [AiModule.forRoot(options)],
      providers: [SseTransport, { provide: AI_TRANSPORT, useExisting: SseTransport }],
      exports: [AI_TRANSPORT, SseTransport],
    };
  }
}
