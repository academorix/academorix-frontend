# @stackra/csp

Content-Security-Policy management for the Stackra framework — per-request nonce
generation, a feature-scoped policy registry with `@CspPolicy()` auto-discovery,
and React bindings (`<NonceProvider>`, `useNonce`, `<Script>`, `<CspMeta>`).
Integrates with `@stackra/ssr` to stamp the CSP header + nonce onto
server-rendered responses.

## Subpaths

| Import               | Contents                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `@stackra/csp`       | Core: `CspModule`, `CspService`, `NonceGenerator`, `CspPolicyLoader`, `CspRegistry`, `@CspPolicy` |
| `@stackra/csp/react` | Web: `NonceProvider`, `NonceContext`, `useNonce`, `<Script>`, `<CspMeta>`                         |

> CSP tokens (`CSP_SERVICE`, `CSP_CONFIG`, `CSP_REGISTRY`) and the `ICspService`
> / `ICspPolicyResult` contracts live in `@stackra/contracts` — import them from
> there. This lets `@stackra/ssr` consume the CSP service without depending on
> this runtime.

## Installation

```jsonc
// package.json
"@stackra/csp": "workspace:*"
```

## Quick start

```typescript
import { Module } from "@stackra/container";
import { CspModule } from "@stackra/csp";

@Module({
  imports: [
    CspModule.forRoot({
      scriptSrc: ["'self'", "'nonce'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    }),
  ],
})
export class AppModule {}
```

## Feature policies

Each package declares the origins it needs — no monolithic app config. Prefer
the decorator (auto-discovered by `CspPolicyLoader` at bootstrap):

```typescript
import { Injectable } from "@stackra/container";
import { CspPolicy } from "@stackra/csp";

@CspPolicy({
  name: "stripe",
  scriptSrc: ["https://js.stripe.com"],
  frameSrc: ["https://hooks.stripe.com"],
})
@Injectable()
export class StripeService {}
```

Or register dynamically:

```typescript
CspModule.forFeature({
  name: "ga",
  scriptSrc: ["https://www.googletagmanager.com"],
});
```

`forFeature` seeds the registry through a lifecycle loader (`createSeedLoader` →
`onApplicationBootstrap`) — no side-effect factories.

## SSR integration

`@stackra/ssr`'s renderer optionally injects `CSP_SERVICE`. When wired, it mints
a fresh nonce per request, passes it to `renderToReadableStream`, and sets the
`Content-Security-Policy` header. For the SPA shell it stamps the
`<script nonce>` and embeds a `<meta http-equiv>` fallback.

To make `useNonce()` / `<Script>` resolve **during** the server render, wrap the
tree in `<NonceProvider>` via the SSR `wrapApp` seam (the decoupled equivalent
of Shopify Hydrogen's manual `entry.server` wrapping — SSR never imports CSP):

```ts
SsrModule.forRoot({
  // ...
  wrapApp: (app, { nonce }) =>
    createElement(NonceProvider, { nonce: nonce ?? "" }, app),
});
```

On the client, recover the nonce the server stamped onto the shell's
`<script nonce>` and re-provide it (Hydrogen's `entry.client` pattern):

```tsx
import { NonceProvider, readDocumentNonce } from "@stackra/csp/react";

const nonce = readDocumentNonce();
root.render(
  <NonceProvider nonce={nonce}>
    <App />
  </NonceProvider>,
);
```

## React

```tsx
import { NonceProvider, useNonce, CspMeta } from '@stackra/csp/react';

// SPA meta fallback (React 19 hoists to <head>)
<CspMeta />

// Distribute the nonce to the tree
<NonceProvider nonce={nonce}><App /></NonceProvider>;

// Consume it for an inline script
const nonce = useNonce();
```

`NonceProvider` lives in `react/providers/`, `NonceContext` in
`react/contexts/`, `useNonce` in `react/hooks/` — the standard layout.

## License

MIT © Stackra L.L.C
