/**
 * @file path.ts
 * @module @stackra/support
 * @description `Path` façade — a static-only path utility that stays
 *   browser-safe by never touching `node:fs`.
 *
 *   All path operations in application code MUST go through this
 *   class rather than assembling `path.resolve(...)` + `fileURLToPath`
 *   chains directly, per `.kiro/steering/support-utilities.md`.
 *
 *   ## Architecture
 *
 *   `Path` layers three concerns:
 *
 *   1. **A root registry** — `setRoot(root)` + `getRoot()` +
 *      `hasRoot()`. The app (via a Vite `define`-injected constant or
 *      an explicit boot-time call) sets the project root ONCE at
 *      startup. Every framework helper that needs "the project root"
 *      reads it through `getRoot()`.
 *
 *   2. **ESM URL helpers** — `dirname(importMetaUrl)`,
 *      `filename(importMetaUrl)`. Convert `import.meta.url` values
 *      into absolute paths without touching the filesystem.
 *
 *   3. **Pure passthroughs to `node:path`** — `join`, `resolve`,
 *      `relative`, `basename`, `extname`, `isAbsolute`, `normalize`,
 *      `parse`, `format`, `sep`, `delimiter`, `replace`. Every one
 *      is pure string manipulation; Vite polyfills `node:path` and
 *      `node:url` for the browser so no bundler workaround is needed.
 *
 *   ## What this file does NOT do
 *
 *   No `node:fs` import, no `existsSync`, no filesystem I/O. That
 *   used to live here (`Path.packageRoot` walked up looking for
 *   `package.json`) and it broke browser bundles because Vite stubs
 *   `node:fs` with a throwing proxy.
 *
 *   `packageRoot()` now returns either the configured `getRoot()`
 *   (the app-wide value) or an explicit walk-N `..` chain from the
 *   caller's `import.meta.url`. Both are pure string ops.
 */

// Path implementation — `path-browserify`, a pure-JS reimplementation
// of Node's `path` API. Every method has identical semantics to
// `node:path` but works uniformly on Node AND in browser bundles
// where Vite externalises `node:path` to a throwing stub.
//
// The alternative (`import path from "node:path"`) would ship
// throwing property-getter code to the browser: even a
// `path.dirname(...)` call at the top of `Path.dirname` would crash
// as soon as any module class' static PACKAGE_ROOT initialiser
// runs. `path-browserify` is a runtime dependency — small, no
// transitive deps of its own, and it's the same package Vite/webpack
// used internally before v7 dropped the automatic polyfill.
//
// `node:url` gets namespace-imported below — Vite stubs it too,
// property-extraction at top level throws. `urlToPath` catches every
// call site and falls back to the WHATWG `URL` class.
import * as urlModule from "node:url";

// Types-only reach into `node:path` for `ParsedPath` +
// `FormatInputPathObject`. `path-browserify`'s type definitions
// don't re-export these sub-namespaces (they live under Node's
// `path.ParsedPath` / `path.FormatInputPathObject`) so we import
// them here. `import type` is erased at build time and produces
// zero runtime code — the browser bundle never touches `node:path`.
import path from "path-browserify";

import type { ParsedPath, FormatInputPathObject } from "node:path";

/**
 * Convert an `import.meta.url` value into an absolute filesystem path
 * that works on both Node and browser runtimes.
 *
 * Two-stage resolution:
 *
 *   1. **Node fast-path** — `urlModule.fileURLToPath(url)` handles
 *      percent-decoding and Windows drive-letter fixups correctly.
 *      Throws when the module is a browser stub (Vite externalises
 *      `node:url` and only exposes `fileURLToPath` via a throwing
 *      getter).
 *
 *   2. **Browser fallback** — parse via the WHATWG `URL` class (a
 *      Web standard, available everywhere) and read `.pathname`.
 *      Strips the leading `/` that `URL.pathname` inserts before a
 *      Windows drive letter (`/C:/foo` → `C:/foo`). Works for
 *      `file://`, `http://`, and `https://` URLs, so a browser
 *      module whose `import.meta.url` is an `http://` served-source
 *      URL still yields a workable path string.
 *
 *   3. **Last resort** — return an empty string. Never throws.
 *      Callers get a benign no-op value in exotic runtimes.
 *
 * @param importMetaUrl - `import.meta.url` of the caller.
 * @returns Absolute filesystem-style path, or `""` when the URL is
 *   unresolvable.
 */
function urlToPath(importMetaUrl: string): string {
  // Node fast-path — throws in browser bundles where Vite stubs
  // `node:url`. Named-property access on the stub goes through a
  // getter that throws unconditionally.
  try {
    return urlModule.fileURLToPath(importMetaUrl);
  } catch {
    // Fall through to the Web-standard URL fallback below.
  }

  // Browser fallback — the WHATWG `URL` class is a Web standard and
  // exists everywhere `Path` runs. `.pathname` gives us the path
  // portion for any URL scheme.
  try {
    const u = new URL(importMetaUrl);
    const raw = u.pathname;

    // Windows `file:///C:/foo` yields `pathname === "/C:/foo"` —
    // strip the leading slash so downstream `path.dirname` etc.
    // see a well-formed path. POSIX paths (no drive letter) pass
    // through unchanged.
    return /^\/[A-Za-z]:\//.test(raw) ? raw.slice(1) : raw;
  } catch {
    // Not a parseable URL. Never throw at module load — module
    // classes shipped to the browser would break with any startup
    // exception. Return empty and let downstream callers handle it.
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root registry — module-scope state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The project root — set once by the app at boot via
 * {@link Path.setRoot}. Every framework helper that needs "the
 * project root" reads this via {@link Path.getRoot}.
 *
 * `null` means "not yet configured" — callers should be resilient to
 * that state (either fall back to a caller-supplied URL or accept
 * an empty result). Never throw on unset — a robust callsite is
 * more valuable than a hard startup crash.
 */
let ROOT: string | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Namespaced façade over Node's `path` + `node:url.fileURLToPath` +
 * a workspace-wide root registry.
 *
 * Static-only — never instantiate. Every method is pure (no I/O, no
 * runtime side effects).
 *
 * @example
 * ```typescript
 * import { Path } from '@stackra/support';
 *
 * // ── App boot (Vite injects __STACKRA_ROOT__ via `define`) ────────
 * Path.setRoot(__STACKRA_ROOT__);
 *
 * // ── Anywhere in framework or app code ───────────────────────────
 * const HERE     = Path.dirname(import.meta.url);
 * const FILE     = Path.filename(import.meta.url);
 * const ROOT     = Path.getRoot();
 * const RESOLVED = Path.resolve(ROOT, 'apps', 'dashboard');
 * const REL      = Path.relative(ROOT, RESOLVED);   // → "apps/dashboard"
 * ```
 */
export class Path {
  /**
   * Private constructor — the class is a static-only namespace.
   *
   * Marks explicit intent: `new Path(...)` is a bug. TS flags
   * `new Path()` at compile time.
   */
  private constructor() {
    // no-op — see the class-level docblock.
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Root registry
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register the app-wide project root.
   *
   * Called ONCE at app boot — typically from a top-of-file
   * `main.tsx` or equivalent entry point. The value comes from a
   * build-time constant injected by Vite (see
   * `apps/*` /vite.config.ts` for the `define: { __STACKRA_ROOT__ }`
   * block) so the browser never has to run any filesystem code to
   * discover its own project root.
   *
   * Idempotent — calling `setRoot` a second time with the same
   * value is a no-op. Calling with a different value replaces the
   * registered root and logs a warning in dev; consumers that need
   * the old value must snapshot it before the second call.
   *
   * @param root - Absolute filesystem path to the project root.
   *   Must be a non-empty string. Trailing separators are stripped.
   *
   * @example
   * ```typescript
   * // apps/dashboard/src/main.tsx (very top of file)
   * import { Path } from '@stackra/support';
   * Path.setRoot(__STACKRA_ROOT__);
   * ```
   */
  public static setRoot(root: string): void {
    if (typeof root !== "string" || root.length === 0) {
      // Fail-loud on a broken input — the alternative is silent
      // wrong behaviour throughout the app.
      throw new TypeError(`Path.setRoot: expected a non-empty string, got ${typeof root}`);
    }

    // Strip trailing separators so `getRoot() + '/subpath'` always
    // produces a well-formed path regardless of how the caller
    // formatted the input.
    const normalised = root.replace(/[/\\]+$/, "");

    if (ROOT !== null && ROOT !== normalised) {
      // Dev-only warning — the workspace does not have a global
      // logger and we don't want to pull one in here. Consumers
      // that care about strict single-init can wrap `setRoot`
      // themselves.
      // eslint-disable-next-line no-console
      console.warn(
        `Path.setRoot: overriding an existing root ("${ROOT}" → "${normalised}"). ` +
          `The previous value has been discarded.`,
      );
    }

    ROOT = normalised;
  }

  /**
   * Read the currently-registered project root.
   *
   * Throws when `setRoot` has never been called — a hard-to-debug
   * silent empty return would be worse than a clear runtime error
   * at first call site. If you want to soft-check the state, use
   * {@link Path.hasRoot}.
   *
   * @returns Absolute filesystem path to the project root.
   * @throws {Error} When the root has not been configured.
   *
   * @example
   * ```typescript
   * const configPath = Path.resolve(Path.getRoot(), 'stackra.config.ts');
   * ```
   */
  public static getRoot(): string {
    if (ROOT === null) {
      throw new Error(
        "Path.getRoot: the project root has not been configured. " +
          "Call Path.setRoot(...) once at app boot — typically from " +
          "your `main.tsx` using a Vite `define`-injected constant.",
      );
    }

    return ROOT;
  }

  /**
   * Predicate — `true` when a root has been registered.
   *
   * Use this to guard optional resolution paths (e.g. framework
   * helpers that prefer `getRoot()` when available but fall back to
   * a caller-supplied URL otherwise).
   */
  public static hasRoot(): boolean {
    return ROOT !== null;
  }

  /**
   * Reset the root registry. Test-only affordance — clears state
   * between spec runs so a test that calls `setRoot` doesn't leak
   * into the next spec. Never call this from production code.
   *
   * @internal
   */
  public static resetRoot(): void {
    ROOT = null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ESM URL helpers
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Absolute path to the directory containing a file, from that
   * file's `import.meta.url`. The ESM equivalent of CJS `__dirname`.
   *
   * Browser-safe — {@link urlToPath} handles the `file://` vs
   * `http://` split so this method works in both runtimes without
   * a `try/catch` at the call site.
   *
   * @param importMetaUrl - `import.meta.url` of the caller.
   * @returns Absolute filesystem path to the caller's directory
   *   (or `""` when the URL is unresolvable — see {@link urlToPath}).
   */
  public static dirname(importMetaUrl: string): string {
    const p = urlToPath(importMetaUrl);

    return p ? path.dirname(p) : "";
  }

  /**
   * Absolute path to a file, from its `import.meta.url`. The ESM
   * equivalent of CJS `__filename`.
   *
   * Browser-safe — see the note on {@link Path.dirname}.
   *
   * @param importMetaUrl - `import.meta.url` of the caller.
   * @returns Absolute filesystem path to the caller's file (or
   *   `""` when unresolvable).
   */
  public static filename(importMetaUrl: string): string {
    return urlToPath(importMetaUrl);
  }

  /**
   * Absolute path to the package root that contains `importMetaUrl`.
   *
   * Two modes — both are pure string ops, no filesystem access:
   *
   *   * **Explicit `levels` mode** — walks `levels` `..` segments up
   *     from `dirname(importMetaUrl)`. This is the canonical form
   *     for every `@stackra/*` module class:
   *
   *     ```ts
   *     public static readonly PACKAGE_ROOT =
   *       Path.packageRoot(import.meta.url, 1);
   *     ```
   *
   *     The `levels` count matches the built dist layout
   *     (`dist/index.mjs` is one directory below the package root).
   *     Tests that run against source can pass an alternate count.
   *
   *   * **No `levels` (default) mode** — returns
   *     {@link Path.getRoot} when a root has been registered, else
   *     falls back to `dirname(importMetaUrl)`. Handy for helper
   *     scripts that want "the project root" without knowing the
   *     caller's file depth.
   *
   * Unlike previous versions, this method **never** touches
   * `node:fs`. Browser bundles that transitively load module classes
   * evaluate the static-field call safely.
   *
   * @param importMetaUrl - `import.meta.url` of the caller.
   * @param levels - Optional explicit walk-count. Positive integer.
   * @returns Absolute filesystem path.
   */
  public static packageRoot(importMetaUrl: string, levels?: number): string {
    // Default mode — the registered root ALWAYS wins over the URL,
    // even before `Path.dirname()` is called. This is the browser
    // fast-path: once `Path.setRoot(__STACKRA_ROOT__)` runs at app
    // boot, every subsequent `Path.packageRoot(import.meta.url)`
    // call in a module class' static-field initialiser returns the
    // app root without touching any URL parsing. Keeps browser
    // module-class evaluation completely fs/url-free after boot.
    //
    // Only checked in the default (no-`levels`) case — the explicit
    // walk-N mode below is a deliberate "give me N `..` from the
    // caller's dirname" and callers who ask for it want URL parsing.
    if (levels === undefined && Path.hasRoot()) return Path.getRoot();

    const here = Path.dirname(importMetaUrl);

    // Explicit walk-N mode.
    if (typeof levels === "number" && levels > 0) {
      if (!here) return "";
      const walk = Array.from({ length: levels }, () => "..");

      return path.resolve(here, ...walk);
    }

    // Fallback — no `levels` AND no registered root. Return the
    // caller's dirname (or "" in an exotic runtime where URL
    // parsing fails). Module classes loaded BEFORE `Path.setRoot()`
    // executes hit this branch; the returned value is meaningless
    // in the browser but harmless (nothing reads PACKAGE_ROOT in
    // browser code) and correct in Node CLI (which walks up from
    // the caller's own dirname).
    return here;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Pure `node:path` passthroughs
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * `path.resolve` — resolve a sequence of paths / path segments
   * into an absolute path.
   *
   * @example
   * ```typescript
   * Path.resolve(Path.getRoot(), 'apps', 'dashboard', 'src');
   * ```
   */
  public static resolve(...segments: string[]): string {
    return path.resolve(...segments);
  }

  /**
   * `path.join` — join path segments using the platform-specific
   * separator, then normalise.
   */
  public static join(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * `path.relative` — get the relative path from `from` to `to`.
   */
  public static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * `path.basename` — last portion of a path. Optional `ext` is
   * stripped when it matches the tail.
   */
  public static basename(p: string, ext?: string): string {
    return ext === undefined ? path.basename(p) : path.basename(p, ext);
  }

  /**
   * `path.extname` — extension of the path, from the last `.` to
   * the end (empty string when there's no `.`).
   */
  public static extname(p: string): string {
    return path.extname(p);
  }

  /**
   * `path.isAbsolute` — `true` when the path is absolute.
   */
  public static isAbsolute(p: string): boolean {
    return path.isAbsolute(p);
  }

  /**
   * `path.normalize` — resolve `..` and `.` segments and normalise
   * repeated separators.
   */
  public static normalize(p: string): string {
    return path.normalize(p);
  }

  /**
   * `path.parse` — decompose a path into its `root`, `dir`, `base`,
   * `ext`, `name` parts.
   */
  public static parse(p: string): ParsedPath {
    return path.parse(p) as ParsedPath;
  }

  /**
   * `path.format` — the inverse of `parse`. Compose a path from a
   * parts object.
   */
  public static format(parts: FormatInputPathObject): string {
    return path.format(parts);
  }

  /**
   * Platform-specific path separator (`/` on POSIX, `\` on Windows).
   */
  public static get sep(): string {
    return path.sep;
  }

  /**
   * Platform-specific `PATH` delimiter (`:` on POSIX, `;` on Windows).
   */
  public static get delimiter(): string {
    return path.delimiter;
  }

  /**
   * Replace every occurrence of `from` in `source` with `to`. Useful
   * for path transformations like rewriting `dist/` → `src/` or
   * stripping a project-root prefix:
   *
   * ```ts
   * const rel = Path.replace(absolutePath, Path.getRoot() + Path.sep, '');
   * ```
   *
   * Pure string operation — `from` is matched literally (no regex).
   *
   * @param source - The path (or path-like) string to transform.
   * @param from - Literal substring to replace.
   * @param to - Replacement string.
   * @returns A new string with every `from` occurrence replaced.
   */
  public static replace(source: string, from: string, to: string): string {
    if (from === "") return source;

    return source.split(from).join(to);
  }
}
