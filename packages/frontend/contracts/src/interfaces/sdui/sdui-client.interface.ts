/**
 * @file sdui-client.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Transport contract for the SDUI runtime.
 */

import type { ISduiScreen } from "./sdui-screen.interface";

/**
 * Public transport contract the SDUI runtime consumes to reach the
 * backend. Implementations wrap `@stackra/http` (production) or return
 * scripted responses (testing).
 */
export interface ISduiClient {
  /** Load an SDUI screen by its route path. */
  loadScreen(path: string): Promise<ISduiScreen>;

  /**
   * Resolve a screen by resource + view (data-driven scene routing).
   * Optional — implementations that don't support the pattern may throw.
   */
  resolveScreen?(input: { resource: string; view: string }): Promise<ISduiScreen>;

  /** Generic pass-through for data-source hydration and `callApi` actions. */
  request<T = unknown>(input: {
    endpoint: string;
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<T>;
}
