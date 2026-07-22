---
"@stackra/queue": minor
"@stackra/scope": minor
---

**Breaking (public API surface only).** Two grandfathered contract pass-throughs
retired. New code should import directly from `@stackra/contracts` per
`contract-reexports.md`:

**`@stackra/queue`** — deleted the local `IProcessorOptions` and `JobEventType`
re-export files:

```ts
// before
import type { IProcessorOptions } from "@stackra/queue";
import type { JobEventType } from "@stackra/queue";

// after
import type { IProcessorOptions, JobEventType } from "@stackra/contracts";
```

**`@stackra/scope`** — dropped the `SCOPE_SERVICE` compat re-export that was
carried through the row-level attribution work:

```ts
// before
import { SCOPE_SERVICE } from "@stackra/scope";

// after
import { SCOPE_SERVICE } from "@stackra/contracts";
```

Every workspace consumer already imports from `@stackra/contracts` — these were
compat shims left over from earlier migrations. No behavioural change; every
workspace package still typechecks, builds, and tests green.
