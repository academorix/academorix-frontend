/**
 * @file index.ts
 * @module providers/live
 *
 * @description
 * Wires the Refine {@link LiveProvider} used for realtime updates. The
 * dashboard always connects to Laravel Reverb via Echo — there is no
 * offline / mock branch anymore now that every domain module ships a
 * real HTTP surface.
 *
 * {@link createNoopLiveProvider} stays exported so callers with a hard
 * requirement to disable realtime (SSR previews, storybook fixtures,
 * automated a11y snapshots) can still opt in explicitly.
 */

import type { LiveProvider } from "@refinedev/core";

import { createReverbLiveProvider } from "@/providers/live/live-provider";

/** The live provider Refine uses for this session. */
export const liveProvider: LiveProvider = createReverbLiveProvider();

export { createNoopLiveProvider, createReverbLiveProvider } from "@/providers/live/live-provider";
export { disconnectEcho, getEcho } from "@/providers/live/echo";
