/**
 * @file use-nonce.hook.ts
 * @module @stackra/csp/react/hooks
 * @description `useNonce()` — access the current CSP nonce from React
 *   context.
 */

import { useContext } from "react";

import { NonceContext } from "../contexts/nonce.context";

/**
 * Access the current CSP nonce value.
 *
 * Returns the nonce string from the nearest `<NonceProvider>`, or an empty
 * string if no provider is present (safe fallback). Use this when you need
 * to manually add a nonce to inline scripts or styles that can't use the
 * `<Script>` component.
 *
 * @returns The current nonce string, or empty string if unavailable.
 *
 * @example
 * ```tsx
 * function InlineScript() {
 *   const nonce = useNonce();
 *   return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: 'x()' }} />;
 * }
 * ```
 */
export function useNonce(): string {
  return useContext(NonceContext);
}
