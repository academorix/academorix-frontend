# Support-Utility Standards

Rules for **which API surface** every string / array / number / URL / env /
timing / pipeline call in the monorepo goes through. There is one canonical
utility library — `@stackra/support` — and application code MUST use it instead
of native or third-party equivalents.

The rule is already self-declared in `support/src/str.ts` (_"all string
operations MUST go through this class rather than using native string methods
directly in application code"_). This document generalises that policy to every
helper the package ships.

Read alongside `code-standards.md` (where files live) and `documentation.md`
(how they are documented).

## Rule — always import helpers from `@stackra/support`

Every source file that manipulates strings, arrays, numbers, URLs, env vars, or
that needs a common functional pattern (retry, sleep, memoise, tap,
optional-chain, timebox) imports from `@stackra/support` instead of using the
native primitive directly or pulling in a third-party equivalent.

### Canonical surface

| Concern                                                               | Use                                                             | Home                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| String manipulation, case conversion, slugs, plurals                  | `Str`                                                           | `@stackra/support` — `Str`                                |
| Array / object utilities (chunk, wrap, pluck, groupBy, flatten)       | `Arr`                                                           | `@stackra/support` — `Arr`                                |
| Chained data pipelines (`.where().pluck().sum()`, `.groupBy().map()`) | `collect(items)`                                                | `@stackra/support` — `collect()` + `Collection<T>`        |
| Number formatting (currency, file size, ordinal, abbreviate)          | `Num`                                                           | `@stackra/support` — `Num`                                |
| URL building (base + path + query + fragment)                         | `Uri.of(base).path(...).query(...)`                             | `@stackra/support` — `Uri`                                |
| Environment variables                                                 | `Env.get / getOrFail / getNumber / getBoolean / isProduction()` | `@stackra/support` — `Env`                                |
| HTML string escaping / safe rendering                                 | `HtmlString`                                                    | `@stackra/support` — `HtmlString`                         |
| Fluent config authoring                                               | `Fluent`                                                        | `@stackra/support` — `Fluent`                             |
| Sequential pipeline pattern                                           | `Pipeline`                                                      | `@stackra/support` — `Pipeline`                           |
| Performance timing                                                    | `Benchmark`                                                     | `@stackra/support` — `Benchmark`                          |
| Bounded execution with a deadline                                     | `timebox(fn, ms)`                                               | `@stackra/support` — `timebox`                            |
| Sleep / pause                                                         | `sleep(ms)`                                                     | `@stackra/support` — `sleep`                              |
| Retry with backoff                                                    | `retry(fn, options)`                                            | `@stackra/support` — `retry`                              |
| Memoise (once)                                                        | `once(fn)`                                                      | `@stackra/support` — `once`                               |
| Tap into a value                                                      | `tap(value, sideEffect)`                                        | `@stackra/support` — `tap`                                |
| Null / undefined chaining                                             | `optional(value).prop(...)`                                     | `@stackra/support` — `optional`                           |
| Registry base class                                                   | `BaseRegistry`                                                  | `@stackra/support` — `BaseRegistry`                       |
| Driver managers                                                       | `Manager`, `MultipleInstanceManager`                            | `@stackra/support` — `Manager`, `MultipleInstanceManager` |

### `Arr` vs. `collect()` — how to choose

- **`Arr`** — small, targeted, single-shot transformations. `Arr.wrap`,
  `Arr.pluck`, `Arr.groupBy`, `Arr.chunk`, `Arr.flatten`.
- **`collect(items)`** — chained pipelines of three or more operations, or when
  you want a fluent `.where().pluck().sum()` API backed by `collect.js`. Import
  through `@stackra/support` only — never `import collect from 'collect.js'`
  directly (`collect.ts`'s docblock is explicit).

## Rule — do not import the underlying primitives / libraries directly

- **No** `import collect from 'collect.js'` — go through `@stackra/support`'s
  `collect()`.
- **No** direct `process.env.X` / `import.meta.env.X` access — go through
  `Env.get()` / `Env.getOrFail()`. `Env` normalises the Node / Vite / window
  `__ENV__` split for you.
- **No** hand-rolled `sleep = (ms) => new Promise(r => setTimeout(r, ms))` — use
  `sleep(ms)` from support.
- **No** hand-rolled retry-with-backoff — use `retry(fn, options)`.
- **No** hand-rolled memoise for module init — use `once(fn)`.

## Migration patterns (audit → fix)

The `support-utilities-steward` uses these detection heuristics against
`**/src/**/*.ts` (excluding `@stackra/support` itself and test files where
indicated):

### Strings → `Str`

Search for these native `.method()` calls on a `string` variable and migrate to
the matching `Str.method()`:

- `.toLowerCase()`, `.toUpperCase()` → `Str.lower`, `Str.upper`
- `.trim()`, `.trimStart()`, `.trimEnd()` → `Str.trim`, `Str.ltrim`, `Str.rtrim`
- `.split(...)` when the intent is "words" or "delimiter" → `Str.words`,
  `Str.split` (case-by-case)
- `.replace(...)`, `.replaceAll(...)` → `Str.replace`, `Str.replaceFirst`,
  `Str.replaceLast`
- `.padStart(...)`, `.padEnd(...)` → `Str.padLeft`, `Str.padRight`
- `.startsWith(...)`, `.endsWith(...)`, `.includes(...)` → `Str.startsWith`,
  `Str.endsWith`, `Str.contains`
- `.slice(...)`, `.substring(...)`, `.substr(...)` → `Str.slice`, `Str.substr`
- Case conversions (camel → snake, PascalCase, kebab-case) → `Str.camel`,
  `Str.snake`, `Str.studly`, `Str.kebab`
- Slug / URL-safe → `Str.slug`
- Plural / singular → `Str.plural`, `Str.singular`
- Templating (`\`hello ${name}\``) is fine — that's a language feature, not a
  helper call.

### Arrays / objects → `Arr` or `collect()`

Migrate when the intent matches:

- `[value].filter(Boolean)` for wrap-or-empty → `Arr.wrap(value)`
- `arr.flat(n)` with dynamic depth → `Arr.flatten(arr, n)`
- Manual grouping (`arr.reduce((acc, x) => { acc[x.k] = ... })`) → `Arr.groupBy`
  or `collect(arr).groupBy(...).all()`
- Manual `.map(item => item.prop)` for one prop → `Arr.pluck`
- Chained `.filter().map().reduce()` (3+ hops) →
  `collect(arr).where().pluck().sum()`

### Numbers → `Num`

- `.toLocaleString('en-US', { style: 'currency' })` → `Num.currency`
- Manual `1024 * 1024` file-size math → `Num.fileSize`
- `.toFixed(n)` + suffix (K / M / B) → `Num.abbreviate` or `Num.format`
- Ordinal string building (`1st`, `2nd`, `3rd`) → `Num.ordinal`

### Env vars → `Env`

- `process.env.X` / `process.env.X ?? default` → `Env.get('X', 'default')`
- `parseInt(process.env.PORT, 10)` → `Env.getNumber('PORT', 3000)`
- `process.env.DEBUG === 'true'` → `Env.getBoolean('DEBUG', false)`
- `process.env.NODE_ENV === 'production'` → `Env.isProduction()`
- Required-or-throw → `Env.getOrFail('X')` (never inline a `throw` after the env
  read — `Env.getOrFail` names the key in the error).

### URLs → `Uri`

- Template-literal URLs
  (`\`${base}/v2/users?page=1\``) → `Uri.of(base).path('v2').path('users').query({
  page: '1' })`
- `new URL('/x', base).searchParams.set(...)` chains →
  `Uri.of(base).path('x').query({...})`
- Manual trailing-slash normalization → drop it (`Uri` handles it).

### Timing / control flow → helpers

- `new Promise((r) => setTimeout(r, ms))` → `sleep(ms)`
- Custom exponential-backoff loops → `retry(fn, { attempts, backoff })`
- Module-level cached factory (`let cached; return cached ??= build()`) →
  `once(build)`
- `Promise.race([fn(), new Promise((_, rej) => setTimeout(rej, ms))])` →
  `timebox(fn, ms)`
- `if (x) { x.doSomething(); }` chains → `optional(x).doSomething()` when the
  goal is "call if present, else no-op".

## Exemptions (do NOT migrate these)

- **`@stackra/support/**` itself.** The utilities cannot depend on themselves —
  the package internals may (and must) use native calls.
- **Comparison operators + literal checks** (`typeof x === 'string'`,
  `x != null`) — these are language features, not helper candidates.
- **Test-only assertions** where a native `.toLowerCase()` is more readable than
  `Str.lower(...)` and no equivalent Str method covers the exact intent. Prefer
  the helper; if you skip it, drop a `// support-utilities-exempt: <why>`
  comment on the line so the audit picks it up as intentional.
- **Perf-critical hot paths** proven by benchmark to regress under the helper.
  Same comment marker:
  `// support-utilities-exempt: hot path, benchmark <link>`.
- **Interop layers** that must return native shapes to a third-party API (e.g. a
  `URL` object to `fetch`, a `Date` to a native platform API). Use `Uri` to
  build, then `.toString()` at the boundary.

## Backlog — utilities `@stackra/support` should add

The audit will surface migration candidates for façades that don't exist yet.
These live in the framework-core-builder's lane; the support-utilities-steward
flags them as findings, doesn't build them.

- **`Date` façade** — canonical for date manipulation. Proposed minimal surface:
  `Date.now()` (millis, matches native), `Date.iso(d)`, `Date.parse(str)`,
  `Date.format(d, pattern)`, `Date.addDays(d, n)`, `Date.diff(a, b, unit)`.
  Detection: `new Date(...).toISOString()`, `Date.now()` used for anything
  beyond simple timing, manual `getUTC*` chains, `date-fns` / `dayjs` / `luxon`
  imports.
- **`Time` façade** — time-only concerns (durations, cron-style intervals,
  formatted "5m 30s" strings). Split from `Date` because they have different
  call sites (schedulers vs. render layers).
- **`Sanitize` / `Validate` helpers** — if a pattern surfaces of hand-rolled
  input sanitization (HTML strip, script-tag strip, DOM purification) we may add
  a `Sanitize` façade. Not yet warranted.

- **`File` façade** — canonical for filesystem I/O across CLI commands
  (`stackra host`, `stackra make:command`, future `stackra config:publish`,
  `stackra cache:clear` …). Proposed surface:
  - `File.read(path, encoding = 'utf8')` — `fs.promises.readFile` wrapper that
    swallows ENOENT and returns `undefined` (fail-soft read), or throws for
    other codes.
  - `File.readOrFail(path)` — throws on any error, names the path in the error
    message.
  - `File.write(path, content)` — atomic write via temp-file rename so partial
    writes never corrupt a target file.
  - `File.append(path, content)` — append with auto-newline handling.
  - `File.exists(path)` — presence check without race conditions.
  - `File.stat(path)` — typed shape (size, mtime, isFile, isDir).
  - `File.copy(src, dest, options?)` / `File.rm(path, options?)` /
    `File.mkdirp(path)` — the trio every scaffolding command needs.
  - `File.readLines(path)` — read → split on `\n` → drop trailing blank
    (replaces the very-common `content.split('\n').filter(Boolean)` pattern).
  - `File.replaceBlock(path, { begin, end, replacement })` — the core of
    `stackra host` and every future block-editor command (idempotent markers →
    replace-in-place → append-if-missing).

  Detection heuristics (once landed, the support-utilities-steward should flag
  these):
  - `import { promises as fs } from 'node:fs'` — flag when the consumer isn't in
    `@stackra/support` itself.
  - `fs.readFile(...)`, `fs.writeFile(...)`, `fs.stat(...)`, `fs.readdir(...)`,
    `fs.mkdir(...)` — flag.
  - `try { await fs.readFile(...) } catch (err) { ... code === 'ENOENT' ...}` —
    flag as `File.read`-shaped.

  **Promotion trigger.** Add `File` to support the moment we have three separate
  non-support packages importing `node:fs` directly. As of 2026-07-15 there is
  exactly one such consumer
  (`packages/routing/src/console/commands/host.command.ts`), so the façade is
  documented but not yet built — that avoids YAGNI on a single call site.

- **`Path` façade** — thin wrapper over `node:path` with the same reasoning as
  `File`. Proposed surface:
  - `Path.join(...parts)` — same shape as `path.join`, but the return-value
    contract is documented explicitly (POSIX separators inside the string,
    resolved at OS boundary if the caller needs a native path).
  - `Path.resolve(base, ...parts)` — `path.resolve` with the `cwd` default made
    explicit.
  - `Path.fromFileUrl(url)` / `Path.toFileUrl(path)` — replaces the very-common
    `pathToFileURL(...).toString()` two-step.
  - `Path.dirname(p)` / `Path.basename(p)` / `Path.ext(p)` — typed wrappers so
    the reader immediately sees "this is a path operation" instead of "this is
    `path.parse(p).dir`".

  **Promotion trigger.** Same threshold as `File` — three independent consumers
  of `node:path` before we add the façade. Currently one consumer
  (`host.command.ts` calls `path.resolve(...)` and `pathToFileURL(...)`), so
  deferred.

- **Should Node built-ins be on `BaseCommand`?** No. Every command extending
  `BaseCommand` inheriting `this.fs` / `this.path` / `this.url` turns the base
  into a god class and hides the actual dependency graph — a command that mocks
  the filesystem in tests has no clean seam to swap. Instead:
  - **Now (<3 commands):** direct `import { promises as fs } from 'node:fs'` in
    the command file. Explicit, tree-shakable, zero abstraction cost.
  - **Later (≥3 commands sharing fs/path usage):** promote to `File` / `Path` on
    `@stackra/support`. Commands import
    `import { File, Path } from '@stackra/support'` — same shape across the
    whole CLI surface.
  - **Only when we need DI-mockable fs:** add `IFileSystem` contract +
    `FILE_SYSTEM` token to `@stackra/contracts`, inject through the container.
    Reserve this for the day a command genuinely needs a mock filesystem for
    tests.

## Enforcement

Zero-hit greps (excluding `support/src/**`) that must pass:

- `\.toLowerCase\(\)`, `\.toUpperCase\(\)`, `\.padStart\(`, `\.padEnd\(`,
  `\.trimStart\(`, `\.trimEnd\(` on a `string` variable — every hit is either a
  `Str.*` call or carries a `// support-utilities-exempt: <why>` comment.
- `process\.env\.` or `import\.meta\.env\.` — every hit goes through `Env.*` or
  carries the exemption marker.
- `import collect from 'collect\.js'` — never; go through `@stackra/support`.
- Local `const sleep = (ms) =>` or `function sleep(ms)` — never; use `sleep`
  from `@stackra/support`.
- Hand-rolled retry loops with `setTimeout` and exponential math — flag for
  `retry(...)` migration.
- `new URL(` + `.searchParams.set(` chain longer than two hops — flag for
  `Uri.*` migration.

## When you're tempted

- **"But `.toLowerCase()` is fine."** In one place, sure. Across 700 files it's
  a slow drift: some places also `.trim()` first, some `.replace(/\s+/g, '-')`
  afterwards, and now you have three slug-adjacent snippets that disagree.
  `Str.slug` is the same everywhere.
- **"I don't want to add a support dependency."** `@stackra/support` is a
  zero-runtime-contract foundation package. Every `@stackra/*` package already
  depends on it (or should). Adding it costs nothing at runtime; not adding it
  costs consistency.
- **"I'll migrate the whole file later."** Migrate the line you're touching. The
  support-utilities-steward will pick up the rest.
