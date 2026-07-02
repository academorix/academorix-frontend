/**
 * @file index.ts
 * @module providers/data
 *
 * @description
 * Selects the active data provider based on the `VITE_API_MOCK` env flag:
 *
 * - `true`  → {@link createMockDataProvider} (JSON fixtures in `public/data`).
 * - `false` → {@link createRestDataProvider} (the real Laravel REST API).
 *
 * Consumers import the resolved `dataProvider` and never care which backend is
 * live — the whole point of the switch. The factories are re-exported for
 * tests that want to construct an isolated provider.
 */

import type { DataProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { httpClient } from "@/lib/http";
import { createMockDataProvider } from "@/providers/data/mock-data-provider";
import { createRestDataProvider } from "@/providers/data/rest-data-provider";

/**
 * The data provider Refine will use for this session. Mock mode adds a little
 * simulated latency locally so loading states are visible during development.
 */
export const dataProvider: DataProvider = env.VITE_API_MOCK
  ? createMockDataProvider({ latencyMs: env.VITE_APP_ENV === "local" ? 250 : 0 })
  : createRestDataProvider(httpClient);

export { createMockDataProvider } from "@/providers/data/mock-data-provider";
export { createRestDataProvider } from "@/providers/data/rest-data-provider";
