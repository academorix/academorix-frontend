# Browser-safe imports in framework packages

Rules for how `@stackra/*` framework packages import from Node core modules
(`node:fs`, `node:path`, `node:url`, `node:os`, `node:crypto`,
`node:child_process`, `node:worker_threads`, …) when the package's public entry
is loaded from the browser.

**Applies to**: every `@stackra/*` package whose `.` entry (or any subpath other
than `./console`, `./vite`, `./cli`, `./testing`) can be reached from browser
code — directly or transitively via `@stackra/support`, `@stackra/container`,
`@stackra/contracts`, `@stackra/routing/react`, etc.

**Does not apply to**: `./console`, `./vite`, `./cli`, `./testing` subpaths —
those are Node-only by design and MAY use `node:*` freely. Browser code is
contractually forbidden from importing them.

## Why this matters

Vite v7+ (and every modern bundler shipping in 2026) externalizes Node core
modules for browser targets. The externalization replaces each `node:*` module
with a stub whose properties are throwing getters:

```
Uncaught Error: Module "fs" has been externalized for browser
compatibility. Cannot access "fs.existsSync" in client code.
```

The throw fires at **module load time** — as soon as the top-level
`import { existsSync } from "node:fs"` line is evaluated by the browser's module
linker. It doesn't matter whether `existsSync` is ever called; the property
extraction alone crashes.

A single leak into the browser-loaded surface takes the whole app down at first
paint. Every framework package's `.` and `./react` entries are on this hot path
via module class evaluation
(`static PACKAGE_ROOT = Path.packageRoot(import.meta.url)`, DI providers, etc.).

## Rule 1 — never name-import from a Node core module in a

browser-reachable entry

```ts
// ❌ BAD — throws in browser at module load
import { existsSync, readFile } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ❌ BAD — same class of error
import fs from "node:fs"; // default import IS a property extraction
```

Even a `default` import (`import fs from "node:fs"`) counts as a property access
in Vite's stub — the "default" export is a getter that throws.

## Rule 2 — namespace-import + property-access guard when the value

is only needed at runtime

```ts
// ✅ OK — namespace import + try/catch guard
import * as fs from "node:fs";
import * as urlModule from "node:url";

function readSafe(path: string): string | null {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    // Browser bundle — fs.readFileSync throws. Fall back cleanly.
    return null;
  }
}
```

The namespace object exists on both runtimes; property access on Vite's stub
throws when you extract a value. Wrapping every access in `try/catch` means the
browser gets a graceful fallback and Node runs normally.

## Rule 3 — prefer pure-JS reimplementations over `node:*` when

one exists

For `node:path`, use **`path-browserify`** — a byte-identical pure-JS
reimplementation. Zero transitive deps, ~5 KB, works everywhere:

```ts
// ✅ BEST for node:path
import path from "path-browserify";

// path.dirname / path.resolve / path.join / etc. all work uniformly
// on Node and in browser bundles.
```

Rationale: pure-JS packages don't get externalized by bundlers, so they behave
identically across runtimes. `path-browserify` is what Vite/webpack internally
used before v7 removed the automatic polyfill.

For `node:url`, there's no clean drop-in — `fileURLToPath` / `pathToFileURL` are
Node-specific. Use Rule 2 (namespace import + guard) and fall back to the WHATWG
`URL` class:

```ts
import * as urlModule from "node:url";

function urlToPath(u: string): string {
  try {
    return urlModule.fileURLToPath(u);
  } catch {
    // Browser — fall back to URL.pathname (WHATWG standard).
    return new URL(u).pathname.replace(/^\/([A-Za-z]:\/)/, "$1");
  }
}
```

## Rule 4 — types-only imports from `node:*` are always safe

`import type` is erased at build time and produces zero runtime code. Use
freely:

```ts
// ✅ SAFE — never emitted to the bundle
import type { ParsedPath } from "node:path";
import type { Stats } from "node:fs";
```

## Rule 5 — verify with a `dist/` grep before shipping

Every framework package's built `dist/index.mjs` must have zero named or default
imports from stubbed Node modules. Namespace imports are permitted (they're
safe). Green means:

```sh
grep -HnE "from ['\"](node:)?(fs|path|url|os|child_process|net|dgram|dns|cluster|worker_threads|tls|readline|repl|tty)['\"]" packages/*/dist/index.mjs
```

Should return either nothing OR only `import * as X` namespace lines. Any
named/default import from a stubbed module → the browser will crash at load.
Fail the review.

Exception: files under `dist/console.*`, `dist/vite.*`, `dist/cli.*` — those are
Node-only subpaths. Consumers agreed to Node-only when they picked the subpath.

## Rule 6 — module class static-field initialisers must never

touch `node:*` at load time

```ts
// ❌ BAD — evaluated at class-load time, browser crashes
export class ConsoleModule {
  public static readonly PACKAGE_ROOT = fs.readFileSync(...);
}

// ✅ GOOD — lazy getter, only computed when read (CLI-time only)
export class ConsoleModule {
  private static #packageRoot: string | undefined;
  public static get PACKAGE_ROOT(): string {
    return (ConsoleModule.#packageRoot ??= /* Node-only compute */);
  }
}
```

Or better still: use `Path.packageRoot(import.meta.url)` from
`@stackra/support`, which routes through `Path.setRoot(...)`'s registered value
in browser contexts and falls back to string-only path manipulation in Node.

## The three offenders (and their fixes) that motivated this rule

| Offender                                                                 | Landed as                                                                                   | Fixed by                                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `import { existsSync } from "node:fs"` in `packages/support/src/path.ts` | Every framework package transitively pulled `fs.existsSync` → browser crashed on Vite stub. | Removed fs walk-up entirely; `Path.packageRoot()` now uses pure string ops.        |
| `import { fileURLToPath } from "node:url"` in the same file              | Same class of crash — Vite stubs `node:url` too.                                            | Namespace import (`import * as urlModule`) + WHATWG `URL` fallback in `urlToPath`. |
| `import path from "node:path"` in the same file                          | Vite stubs `node:path` in v7+ (previously polyfilled automatically).                        | Swap to `path-browserify` — pure JS, works everywhere.                             |

Every future addition to the framework layer must clear these three gates BEFORE
landing in a browser-reachable entry.
