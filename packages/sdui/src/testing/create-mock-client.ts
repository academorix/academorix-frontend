/**
 * @file create-mock-client.ts
 * @module @stackra/sdui/testing
 * @description In-memory `ISduiClient` for unit tests.
 */

import type { ISduiClient, ISduiScreen } from '@stackra/contracts';

/**
 * Script for the mock client. Every field is optional — the mock throws
 * a descriptive error when a caller hits an unscripted path.
 */
export interface IMockSduiClientScript {
  readonly screens?: Readonly<Record<string, ISduiScreen>>;
  readonly resolves?: Readonly<Record<string, ISduiScreen>>;
  readonly requests?: Readonly<Record<string, unknown>>;
}

/**
 * A scripted, assertable `ISduiClient` for tests.
 */
export interface IMockSduiClient extends ISduiClient {
  /** Every `loadScreen` / `resolveScreen` / `request` call recorded here. */
  readonly calls: readonly {
    method: 'loadScreen' | 'resolveScreen' | 'request';
    args: unknown;
  }[];
  reset(): void;
}

/**
 * Create a scripted `ISduiClient` for tests.
 */
export function createMockSduiClient(script: IMockSduiClientScript = {}): IMockSduiClient {
  const calls: { method: 'loadScreen' | 'resolveScreen' | 'request'; args: unknown }[] = [];

  return {
    async loadScreen(path: string): Promise<ISduiScreen> {
      calls.push({ method: 'loadScreen', args: path });
      const screen = script.screens?.[path];
      if (!screen) throw new Error(`[mock-sdui-client] No scripted screen for "${path}"`);
      return screen;
    },

    async resolveScreen(input: { resource: string; view: string }): Promise<ISduiScreen> {
      calls.push({ method: 'resolveScreen', args: input });
      const key = `${input.resource}:${input.view}`;
      const screen = script.resolves?.[key];
      if (!screen) throw new Error(`[mock-sdui-client] No scripted resolve for "${key}"`);
      return screen;
    },

    async request<T = unknown>(input: {
      endpoint: string;
      method?: string;
      body?: unknown;
    }): Promise<T> {
      calls.push({ method: 'request', args: input });
      const scripted = script.requests?.[input.endpoint];
      if (scripted === undefined) {
        throw new Error(`[mock-sdui-client] No scripted request for "${input.endpoint}"`);
      }
      return scripted as T;
    },

    get calls() {
      return calls;
    },

    reset() {
      calls.length = 0;
    },
  };
}
