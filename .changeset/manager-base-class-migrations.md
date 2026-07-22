---
"@stackra/cache": patch
"@stackra/queue": patch
---

Land findings F1 + F2 from the manager base-class review at
`.kiro/reports/manager-base-class-review-2026-07-22.md`.

`CacheManager` and `QueueManager` both migrate from `Manager<T>` (one shared
driver factory) to `MultipleInstanceManager<T>` (N independently-configured
named instances). Their config surfaces carry per-instance settings
(`stores.<name>.ttl`, `connections.<name>. prefix`, etc.), so
`MultipleInstanceManager` was always the correct base per
`.kiro/steering/package-conventions.md` §"Manager base — pick the right one".

**Non-breaking public-API-wise:**

- `cache.store(name?)` and `queue.connection(name?)` return the same types they
  always did.
- `cache.getDefaultDriver()` and `queue.getDefaultDriver()` still work — they
  delegate to the base's `getDefaultInstance()`.
- `manager.extend(driver, creator)` still registers a custom driver factory; the
  base's signature now passes the resolved config to the creator (was zero-arg),
  so existing zero-arg creators keep working under normal JS argument slack.

Behaviour parity verified: full test suites for both packages pass (73 cache
tests, 55 queue tests). Full workspace typecheck exits 0 across all 42 frontend
packages.
