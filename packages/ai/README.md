# @stackra/ai

Client-side AI toolkit for the Stackra framework — the client counterpart to
the `academorix/ai` PHP backend. It streams chat over a swappable transport
(`@stackra/http` SSE today, WebSocket later), lets mounted components
contribute client tools and UI context frames that self-register on mount,
surfaces personas and a draft-then-confirm write flow, and renders the whole
surface on HeroUI Pro chat primitives via `@stackra/ui`.

## Subpaths

| Import                | Purpose                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `@stackra/ai`         | Platform-agnostic core: services, registries, decoder, transport seam, DI           |
| `@stackra/ai/react`   | Web bindings: `WebAiModule`, `AiProvider`, hooks, HeroUI Pro components             |
| `@stackra/ai/native`  | React Native bindings: `NativeAiModule` + cross-platform hooks (no components)      |
| `@stackra/ai/testing` | Test doubles: `createMockTransport`, `createMockAiClient`, `createMockToolRegistry` |

## Setup (web)

```ts
// src/main.ts
import 'reflect-metadata';
import { ApplicationFactory, Module } from '@stackra/container';
import { HttpModule } from '@stackra/http';
import { WebAiModule } from '@stackra/ai/react';

@Module({
  imports: [
    HttpModule.forRoot({
      default: 'api',
      connections: {
        api: { baseURL: 'https://api.example.com', timeout: 30_000 },
      },
    }),
    WebAiModule.forRoot({
      baseUrl: 'https://api.example.com',
      authProvider: {
        async getCredentials() {
          return { token: await getBearerToken() };
        },
        async refresh() {
          return { token: await refreshBearerToken() };
        },
      },
      context: { debounceMs: 500, leaderGated: true },
    }),
  ],
})
class AppModule {}

await ApplicationFactory.create(AppModule);
```

```tsx
// src/App.tsx
import { AiProvider, AiChat } from '@stackra/ai/react';

export function App() {
  return (
    <AiProvider>
      <AiChat persona="analyst" />
    </AiProvider>
  );
}
```

## Client tools

Mounted components declare tools with a single hook. The tool is registered
while the host is mounted and unregistered on unmount — availability tracks
the rendered UI exactly the way context frames do.

```tsx
import { z } from 'zod';
import { useAiTool } from '@stackra/ai/react';
import { useNavigate } from 'react-router';

export function OrdersView() {
  const navigate = useNavigate();

  useAiTool({
    name: 'navigate',
    description: 'Navigate to a URL inside the app.',
    parameters: z.object({ url: z.string() }),
    handler: async ({ url }) => {
      navigate(url as string);
      return { ok: true };
    },
  });

  return <OrdersList />;
}
```

Reusable, decoupled tool definitions use the `createAiTool` factory:

```tsx
import { createAiTool } from '@stackra/ai/react';

const useNavigateTool = createAiTool({
  name: 'navigate',
  description: 'Navigate the UI',
  parameters: z.object({ url: z.string() }),
});

function OrdersView() {
  const navigate = useNavigate();
  useNavigateTool(async ({ url }) => {
    navigate(url as string);
    return { ok: true };
  });
  return <OrdersList />;
}
```

## Context frames

Contribute a snapshot of what the user is looking at while your component is
mounted. Frames are ordered as a focus stack (popup > drawer > page), PII
redacted, size-capped, debounced, diffed, and multi-tab-leader-gated before
being synced.

```tsx
import { useAiContextFrame } from '@stackra/ai/react';

export function CustomerPanel({ customer }) {
  useAiContextFrame(
    `customer:${customer.id}`,
    { name: customer.name, plan: customer.plan },
    { priority: 1 }
  );
  return <CustomerFields customer={customer} />;
}
```

## Approval-required tools

Declare `requiresApproval: true` on the tool definition. The tool call renders
in HeroUI Pro's `ChatTool` `requires-action` state with wired approve / reject
buttons. Approving resumes execution; rejecting posts a rejection result.

```ts
useAiTool({
  name: 'refundOrder',
  description: 'Refund an order.',
  parameters: z.object({ orderId: z.string(), amount: z.number() }),
  requiresApproval: true,
  handler: async (args) => api.refund(args),
});
```

## Compliance highlights

- No `class *Bootstrap` classes — every stateful service uses `OnModuleInit`
  / `OnApplicationBootstrap` for post-wire population and discovery. Feature
  seeding uses `createSeedLoader` from `@stackra/support`.
- Zero re-exports of `@stackra/contracts` — consumers import tokens /
  interfaces / enums / events from `@stackra/contracts` directly.
- Components compose HeroUI Pro primitives via `@stackra/ui/react` only and
  ship no bespoke CSS class names — only layout utilities.
- Transport swap guarantee — replacing the SSE transport with a WebSocket
  transport is a one-line `useClass` change in the platform module.
- Every context frame passes through the `PiiRedactor` before leaving the
  client.

## License

MIT © Stackra L.L.C
