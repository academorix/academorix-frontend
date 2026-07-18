/**
 * @file stackra-routing.context.ts
 * @module @stackra/routing/react/contexts/stackra-routing
 * @description React context that exposes the routing state
 *   published by `<StackraRoutingProvider>`.
 *
 *   Default value is `null` — hooks that require the context branch
 *   on that to detect callers outside the provider (per PLAN v3.12.3)
 *   and throw a clear error.
 */

import { createContext } from "react";

import type { IStackraRoutingContext } from "./stackra-routing-context-value.interface";

/**
 * React context that carries the DI container, merged config, and
 * RRv7 data-router. Consumed by every routing hook.
 */
export const StackraRoutingContext = createContext<IStackraRoutingContext | null>(null);
