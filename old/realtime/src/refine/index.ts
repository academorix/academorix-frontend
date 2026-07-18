/**
 * @file index.ts
 * @module @academorix/realtime/refine
 *
 * @description
 * Public barrel for the Refine `LiveProvider` adapters. Consumed by
 * the dashboard's `<Refine liveProvider={...}>`. Not used by the
 * marketing app — that surface has no Refine.
 */

export { createNoopLiveProvider, createReverbLiveProvider } from "./create-reverb-live-provider";
export type {
  LiveEvent,
  LiveEventType,
  LiveSubscribeArgs,
  RefineLiveProvider,
} from "./reverb-live-provider.type";
