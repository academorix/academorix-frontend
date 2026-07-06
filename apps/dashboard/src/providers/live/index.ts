/**
 * @file index.ts
 * @module providers/live
 *
 * @description
 * Selects the active live provider based on `VITE_API_MOCK`:
 * - `true`  → {@link createNoopLiveProvider} (no realtime server in mock mode).
 * - `false` → {@link createReverbLiveProvider} (Laravel Reverb via Echo).
 */

import type { LiveProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { createNoopLiveProvider, createReverbLiveProvider } from "@/providers/live/live-provider";

/** The live provider Refine will use for this session. */
export const liveProvider: LiveProvider = env.VITE_API_MOCK
  ? createNoopLiveProvider()
  : createReverbLiveProvider();

export { createNoopLiveProvider, createReverbLiveProvider } from "@/providers/live/live-provider";
export { disconnectEcho, getEcho } from "@/providers/live/echo";
