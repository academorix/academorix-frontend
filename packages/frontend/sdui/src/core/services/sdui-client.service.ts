/**
 * @file sdui-client.service.ts
 * @module @stackra/sdui/core/services
 * @description Null-implementation SDUI client — the default `ISduiClient`
 *   bound at `SduiModule.forRoot` when no consumer-supplied client is
 *   provided. Every method throws with a clear message so tests / dev
 *   environments surface the missing transport wiring immediately.
 *
 *   Production apps register their own client via
 *   `SduiModule.forRoot({ client: myHttpBackedClient })`.
 */

import { Injectable } from "@stackra/container";
import type { ISduiClient, ISduiScreen } from "@stackra/contracts";

/**
 * A no-op SDUI client that fails loudly. Placeholder bound when the
 * consumer has not supplied a real one.
 */
@Injectable()
export class NullSduiClient implements ISduiClient {
  public async loadScreen(_path: string): Promise<ISduiScreen> {
    throw new Error(
      "[sdui] No ISduiClient configured. Provide one via SduiModule.forRoot({ client: ... }).",
    );
  }

  public async resolveScreen(_input: { resource: string; view: string }): Promise<ISduiScreen> {
    throw new Error(
      "[sdui] No ISduiClient configured. Provide one via SduiModule.forRoot({ client: ... }).",
    );
  }

  public async request<T>(_input: {
    endpoint: string;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<T> {
    throw new Error(
      "[sdui] No ISduiClient configured. Provide one via SduiModule.forRoot({ client: ... }).",
    );
  }
}
