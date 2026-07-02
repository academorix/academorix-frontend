/**
 * @file index.ts
 * @module providers/auth
 *
 * @description
 * Selects the active auth provider based on `VITE_API_MOCK`:
 * - `true`  → {@link createMockAuthProvider} (JSON identity fixture).
 * - `false` → {@link createRestAuthProvider} (Laravel + Sanctum tokens).
 *
 * Both share the same {@link tokenStore} and session cache, so the rest of the
 * app is agnostic to which one is live.
 */

import type { AuthProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { httpClient, tokenStore } from "@/lib/http";
import { createMockAuthProvider } from "@/providers/auth/auth-provider.mock";
import { createRestAuthProvider } from "@/providers/auth/auth-provider.rest";

/** The auth provider Refine will use for this session. */
export const authProvider: AuthProvider = env.VITE_API_MOCK
  ? createMockAuthProvider(tokenStore)
  : createRestAuthProvider(httpClient, tokenStore);

export { createMockAuthProvider } from "@/providers/auth/auth-provider.mock";
export { createRestAuthProvider } from "@/providers/auth/auth-provider.rest";
export * from "@/providers/auth/session";
