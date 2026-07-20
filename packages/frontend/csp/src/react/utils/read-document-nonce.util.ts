/**
 * @file read-document-nonce.util.ts
 * @module @stackra/csp/react/utils
 * @description Recover the CSP nonce on the client from the rendered DOM.
 *
 *   The server stamps a nonce onto its `<script nonce>` tags. On the client,
 *   read it back and feed it to `<NonceProvider>` so `useNonce()` / `<Script>`
 *   keep working during hydration and subsequent client rendering — the same
 *   pattern Shopify Hydrogen uses in its `entry.client`.
 */

/**
 * Read the CSP nonce from the first `<script nonce>` tag in the document.
 *
 * @returns The nonce string, or `''` when absent (SSR-safe — returns `''`
 *   when there is no `document`).
 *
 * @example
 * ```tsx
 * import { NonceProvider, readDocumentNonce } from '@stackra/csp/react';
 *
 * const nonce = readDocumentNonce();
 * hydrateRoot(el, <NonceProvider nonce={nonce}><App /></NonceProvider>);
 * ```
 */
export function readDocumentNonce(): string {
  if (typeof document === 'undefined') return '';
  return document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ?? '';
}
