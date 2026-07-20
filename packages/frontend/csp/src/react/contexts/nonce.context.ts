/**
 * @file nonce.context.ts
 * @module @stackra/csp/react/contexts
 * @description React context holding the current CSP nonce value for the
 *   React tree. Consumed by `useNonce()` and the `<Script>` component.
 */

import { createContext } from "react";

/**
 * React context holding the current CSP nonce.
 *
 * Default value is an empty string (no nonce — a safe fallback).
 * Populated by `<NonceProvider>`.
 */
export const NonceContext = createContext<string>("");

NonceContext.displayName = "NonceContext";
