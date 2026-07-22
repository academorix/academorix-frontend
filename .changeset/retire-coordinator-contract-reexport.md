---
"@stackra/coordinator": minor
---

**Breaking (public API surface only).** `@stackra/coordinator` no longer
re-exports `TAB_LOCK_MANAGER` from `@stackra/contracts`. Import the token
directly from `@stackra/contracts` per `contract-reexports.md`:

```ts
// before
import { TAB_LOCK_MANAGER } from "@stackra/coordinator";

// after
import { TAB_LOCK_MANAGER } from "@stackra/contracts";
```

Every workspace consumer already imports from `@stackra/contracts` — the
re-export was a grandfathered compat shim carried through the row-level
attribution work and is now retired.
