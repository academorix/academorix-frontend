/**
 * @file nonce.provider.tsx
 * @module @stackra/csp/react/providers
 * @description NonceProvider — distributes the CSP nonce to the React tree.
 *
 *   Place at the root of your app (inside the container provider).
 *   Components read the nonce via `useNonce()`. Logic-only provider — owns
 *   no markup, so it is exempt from the HeroUI UI rule.
 */

import { type PropsWithChildren, type ReactElement } from "react";

import { NonceContext } from "@/react/contexts/nonce.context";
import type { NonceProviderProps } from "@/react/interfaces/nonce-provider-props.interface";

/**
 * Provides the CSP nonce to all child components via React context.
 *
 * @example
 * ```tsx
 * const { nonce } = csp.getPolicy();
 * <NonceProvider nonce={nonce}>
 *   <App />
 * </NonceProvider>
 * ```
 *
 * @param props - Provider props with nonce value and children.
 * @returns The context provider wrapping children.
 */
export function NonceProvider({
  nonce,
  children,
}: PropsWithChildren<NonceProviderProps>): ReactElement {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}

NonceProvider.displayName = "NonceProvider";
