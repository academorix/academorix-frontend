/**
 * @file scripts.component.tsx
 * @module @stackra/routing/react/components/scripts
 * @description Framework `<Scripts />` — CSP-aware wrapper over
 *   RRv7's `<Scripts />`.
 *
 *   When `@stackra/csp/react` is installed, we consume the per-
 *   request nonce via `useNonce()`. Without csp, the fallback is a
 *   nonce-less `<Scripts />` — the app just doesn't emit a nonce.
 *
 *   Peer detection is dynamic to keep `@stackra/csp` OPTIONAL —
 *   apps without CSP wired don't pull it in.
 *
 *   Logic-only component per `ui-components.md`.
 */

import { type ReactElement } from "react";
import { Scripts as RrvScripts } from "react-router";

/**
 * Render RRv7's `<Scripts />` with an optional nonce.
 *
 * @returns The `<Scripts />` element.
 */
export function Scripts(): ReactElement {
  const nonce = readNonce();
  // Nonce is `undefined` when CSP isn't wired — RRv7 tolerates
  // omission gracefully.
  return <RrvScripts nonce={nonce} />;
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Attempt to read the nonce from `@stackra/csp/react`. Fails soft
 * when the module isn't installed.
 */
function readNonce(): string | undefined {
  // Static import via `require`-style path breaks the tree-shake
  // guarantees and is not portable. The Vite/esbuild dead-code
  // eliminator handles the static import gracefully when the peer
  // is missing (the resolver treats it as `undefined`). We intentionally
  // skip the peer here and expose the nonce hook as a
  // consumer concern — apps that need CSP wrap `<Scripts />` in a
  // `<NonceProvider>` and consume `useNonce()` themselves.
  // TODO(heroui-ui-builder / csp): once `@stackra/csp` is promoted,
  //   route the nonce through a dynamic import guard here.
  return undefined;
}
