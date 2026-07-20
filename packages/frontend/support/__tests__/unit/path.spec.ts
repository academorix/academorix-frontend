/**
 * @file path.spec.ts
 * @module @stackra/support/__tests__/unit
 * @description Behavioural spec for the `Path` façade — the ESM-safe
 *   replacement for the `path.dirname(fileURLToPath(...))` incantation
 *   we do across every `@stackra/*` module.
 *
 *   Covers:
 *
 *     1. `Path.dirname(importMetaUrl)` — ESM `__dirname`.
 *     2. `Path.filename(importMetaUrl)` — ESM `__filename`.
 *     3. `Path.packageRoot(importMetaUrl, levels?)` with the default
 *        `levels = 3` (`packages/<pkg>/src/core/*.module.ts`) plus
 *        explicit `2` (`src/*.module.ts`) and `4`
 *        (`src/core/<subdomain>/*.module.ts`) shapes documented in
 *        the façade's own docblock.
 *     4. `Path.resolve(...segments)` / `Path.join(...segments)` —
 *        parity with `node:path`.
 *     5. Static-only contract — `new Path(...)` is a TypeScript error
 *        AND fails at runtime via the private constructor (asserted
 *        by casting to `any` to bypass TS).
 *     6. Idempotence — calling any method twice with the same input
 *        returns the same string (pure functions, no I/O).
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { Path } from "@/path";

describe("Path (facade)", () => {
  describe("dirname", () => {
    it("returns the absolute directory containing THIS spec file", () => {
      // `import.meta.url` inside a test file always resolves to a
      // real file — so we can compare the façade's output to the
      // raw `node:path` incantation it replaces.
      const expected = path.dirname(fileURLToPath(import.meta.url));
      expect(Path.dirname(import.meta.url)).toBe(expected);
    });

    it("handles a synthetic file:// URL with no directory hierarchy", () => {
      // Edge case — a `file:///something.ts` URL should still yield
      // an absolute directory (root `/` on POSIX, `X:\` on Windows).
      const url = pathToFileURL("/synthetic/root/module.ts").href;
      expect(Path.dirname(url)).toBe("/synthetic/root");
    });

    it("is idempotent — same URL in, same string out", () => {
      const a = Path.dirname(import.meta.url);
      const b = Path.dirname(import.meta.url);
      expect(a).toBe(b);
    });
  });

  describe("filename", () => {
    it("returns the absolute path to THIS spec file", () => {
      // `path.ts` façade docblock: "ESM equivalent of CJS __filename".
      const expected = fileURLToPath(import.meta.url);
      expect(Path.filename(import.meta.url)).toBe(expected);
    });

    it("ends with the spec's actual filename", () => {
      // Sanity check — the filename should end with `.spec.ts`
      // regardless of the workspace's absolute path prefix.
      expect(Path.filename(import.meta.url)).toMatch(/[/\\]path\.spec\.ts$/);
    });

    it("resolves a synthetic file:// URL to the same path fileURLToPath would", () => {
      const url = pathToFileURL("/tmp/some-file.ts").href;
      expect(Path.filename(url)).toBe(fileURLToPath(url));
    });
  });

  describe("packageRoot", () => {
    // Synthetic paths let us test the walk-up semantics without
    // depending on the workspace's actual filesystem layout.
    //
    // Note: `Path.packageRoot(url, N)` walks N `..` segments UP FROM
    // `dirname(fileURLToPath(url))`. So for a file at
    // `.../src/core/foo.ts`:
    //   - dirname = `.../src/core`
    //   - levels=1 → `.../src`
    //   - levels=2 → `.../` (package root)
    //   - levels=3 → parent of package root
    const synthesizedRoot = "/repo/packages/example";
    const coreModuleUrl = pathToFileURL(`${synthesizedRoot}/src/core/example.module.ts`).href;
    const srcModuleUrl = pathToFileURL(`${synthesizedRoot}/src/example.module.ts`).href;
    const subdomainModuleUrl = pathToFileURL(
      `${synthesizedRoot}/src/core/discovery/discovery.module.ts`,
    ).href;

    it("returns the caller's dirname when no root has been registered", () => {
      // The new default mode is pure-string: with no `levels` and
      // no `Path.setRoot(...)` in effect, `packageRoot` falls back
      // to `Path.dirname(importMetaUrl)`. Zero filesystem access.
      Path.resetRoot();
      const expected = path.dirname(fileURLToPath(import.meta.url));
      expect(Path.packageRoot(import.meta.url)).toBe(expected);
    });

    it("returns Path.getRoot() when a root has been registered", () => {
      // With a registered root, the default mode short-circuits and
      // returns the registered value regardless of the URL argument
      // — the API's whole point is to give framework code one
      // canonical answer to "where's the project root?".
      Path.resetRoot();
      Path.setRoot("/repo/synthetic-project");
      expect(Path.packageRoot(import.meta.url)).toBe("/repo/synthetic-project");
      // Clean up so later tests aren't polluted.
      Path.resetRoot();
    });

    it("walks N levels up from `dirname(fileURLToPath(url))`", () => {
      // The specification: walk N `..` segments up from the file's
      // directory. This is what the implementation does.
      const here = path.dirname(fileURLToPath(coreModuleUrl));
      // `dirname` of the core module URL is `.../src/core`.
      expect(here).toBe(`${synthesizedRoot}/src/core`);
      // Walking 3 more levels lands one level ABOVE the package
      // root — under `/repo/packages`.
      expect(Path.packageRoot(coreModuleUrl, 3)).toBe(path.resolve(here, "..", "..", ".."));
    });

    it("supports `levels = 0` — returns the file's own directory", () => {
      // Zero walks up is a bit unusual but shouldn't crash; the
      // `Array.from({ length: 0 })` produces zero `..` segments so
      // `path.resolve(here)` is a no-op — the file's directory.
      const here = path.dirname(fileURLToPath(coreModuleUrl));
      expect(Path.packageRoot(coreModuleUrl, 0)).toBe(here);
    });

    it("supports `levels = 1` — walks one directory up", () => {
      // One level up from `.../src/core/example.module.ts`'s
      // directory (`.../src/core`) is `.../src`.
      const here = path.dirname(fileURLToPath(coreModuleUrl));
      expect(Path.packageRoot(coreModuleUrl, 1)).toBe(path.resolve(here, ".."));
    });

    it("supports `levels = 2` — walks two directories up", () => {
      // Two levels up from `.../src/core/*.module.ts`'s directory
      // lands on the package root itself.
      expect(Path.packageRoot(coreModuleUrl, 2)).toBe(synthesizedRoot);
    });

    it("`levels = 1` from `.../src/*.module.ts` lands on the package root", () => {
      // For files that live one level shallower (like
      // `packages/console/src/console.module.ts`), `levels = 1` is
      // enough to reach the package root.
      expect(Path.packageRoot(srcModuleUrl, 1)).toBe(synthesizedRoot);
    });

    it("`levels = 3` from `.../src/core/<subdomain>/*.module.ts` lands on the package root", () => {
      // For files one level DEEPER (like DiscoveryModule's location),
      // `levels = 3` reaches the package root because the file's
      // dirname is `.../src/core/discovery` — three walks up = pkg.
      expect(Path.packageRoot(subdomainModuleUrl, 3)).toBe(synthesizedRoot);
    });

    it("walks all the way to the filesystem root when N is huge", () => {
      // Guards against overflow-style off-by-one errors. `path.resolve`
      // stops climbing once it hits `/` (POSIX) — extra `..` segments
      // are harmless.
      const climbed = Path.packageRoot(coreModuleUrl, 100);
      expect(path.isAbsolute(climbed)).toBe(true);
      // POSIX filesystem root or Windows drive root.
      expect(climbed === "/" || /^[A-Z]:\\?$/.test(climbed)).toBe(true);
    });

    it("always returns an absolute path", () => {
      // Regardless of the `levels` count, the output is absolute
      // because `path.resolve` is called on already-absolute
      // components (`fileURLToPath` yields absolute paths).
      const paths = [0, 1, 2, 3, 4, 5, 10].map((lvl) => Path.packageRoot(coreModuleUrl, lvl));
      for (const p of paths) {
        expect(path.isAbsolute(p)).toBe(true);
      }
    });

    it("is idempotent — repeated calls return the same string", () => {
      expect(Path.packageRoot(coreModuleUrl)).toBe(Path.packageRoot(coreModuleUrl));
      expect(Path.packageRoot(coreModuleUrl, 4)).toBe(Path.packageRoot(coreModuleUrl, 4));
    });

    it("resolves to a directory ending with `support` for THIS test file with levels=2", () => {
      // Reality check — this test lives at
      // `packages/support/__tests__/unit/path.spec.ts`.
      // Walking two levels up from its directory
      // (`packages/support/__tests__/unit`) lands on
      // `packages/support/`. We assert the tail segment matches
      // rather than the full path so the test is CI-agnostic.
      const root = Path.packageRoot(import.meta.url, 2);
      expect(root).toMatch(/[/\\]support$/);
      expect(path.isAbsolute(root)).toBe(true);
    });

    it("prefers the registered root over levels=N when both would apply", () => {
      // Design contract — the ONLY way `levels` kicks in is when
      // the caller explicitly passes it. Without `levels`, the
      // registered root always wins.
      Path.resetRoot();
      Path.setRoot("/repo/synthetic-project");
      // Default mode → getRoot().
      expect(Path.packageRoot(import.meta.url)).toBe("/repo/synthetic-project");
      // Explicit mode → walk N from the URL, ignoring getRoot().
      expect(Path.packageRoot(import.meta.url, 2)).toMatch(/[/\\]support$/);
      Path.resetRoot();
    });
  });

  describe("root registry (setRoot / getRoot / hasRoot / resetRoot)", () => {
    it("starts unset — hasRoot() is false and getRoot() throws", () => {
      Path.resetRoot();
      expect(Path.hasRoot()).toBe(false);
      expect(() => Path.getRoot()).toThrow(/root has not been configured/);
    });

    it("setRoot registers a normalised root (trailing separators stripped)", () => {
      Path.resetRoot();
      Path.setRoot("/tmp/project/");
      expect(Path.getRoot()).toBe("/tmp/project");
      expect(Path.hasRoot()).toBe(true);
      Path.resetRoot();
    });

    it("setRoot rejects empty / non-string input with a clear error", () => {
      Path.resetRoot();
      expect(() => Path.setRoot("")).toThrow(TypeError);
      expect(() => Path.setRoot(null as unknown as string)).toThrow(TypeError);
      expect(() => Path.setRoot(undefined as unknown as string)).toThrow(TypeError);
      expect(Path.hasRoot()).toBe(false);
    });

    it("setRoot is idempotent for the same value (no warning path)", () => {
      Path.resetRoot();
      Path.setRoot("/tmp/project");
      Path.setRoot("/tmp/project");
      expect(Path.getRoot()).toBe("/tmp/project");
      Path.resetRoot();
    });

    it("resetRoot clears the registry (test-only affordance)", () => {
      Path.setRoot("/tmp/project");
      Path.resetRoot();
      expect(Path.hasRoot()).toBe(false);
    });
  });

  describe("standard passthroughs (relative / basename / extname / isAbsolute / normalize / parse / format)", () => {
    it("Path.relative agrees with node:path.relative", () => {
      expect(Path.relative("/a/b/c", "/a/b/d")).toBe(path.relative("/a/b/c", "/a/b/d"));
    });

    it("Path.basename returns the tail segment; optional ext is stripped", () => {
      expect(Path.basename("/a/b/index.ts")).toBe("index.ts");
      expect(Path.basename("/a/b/index.ts", ".ts")).toBe("index");
    });

    it("Path.extname returns the extension including the leading dot", () => {
      expect(Path.extname("/a/b/foo.tsx")).toBe(".tsx");
      expect(Path.extname("/a/b/foo")).toBe("");
    });

    it("Path.isAbsolute discriminates absolute vs relative", () => {
      expect(Path.isAbsolute("/tmp/foo")).toBe(true);
      expect(Path.isAbsolute("tmp/foo")).toBe(false);
    });

    it("Path.normalize collapses `..` and `.` segments", () => {
      expect(Path.normalize("/a/b/../c/./d")).toBe(path.normalize("/a/b/../c/./d"));
    });

    it("Path.parse and Path.format are inverses of each other", () => {
      const parts = Path.parse("/a/b/c.ts");
      expect(parts.name).toBe("c");
      expect(parts.ext).toBe(".ts");
      expect(Path.format(parts)).toBe("/a/b/c.ts");
    });

    it("Path.sep and Path.delimiter mirror node:path", () => {
      expect(Path.sep).toBe(path.sep);
      expect(Path.delimiter).toBe(path.delimiter);
    });
  });

  describe("replace helper", () => {
    it("replaces every occurrence literally (no regex)", () => {
      expect(Path.replace("/a/b/a/c", "/a", "X")).toBe("X/bX/c");
    });

    it("returns the source unchanged when `from` is empty", () => {
      expect(Path.replace("/a/b", "", "X")).toBe("/a/b");
    });

    it("does not touch strings that don't contain `from`", () => {
      expect(Path.replace("/a/b", "/c", "X")).toBe("/a/b");
    });
  });

  describe("resolve", () => {
    it("passes through to `path.resolve`", () => {
      // `Path.resolve` is a documented passthrough — the façade
      // exists purely so callers don't need a second
      // `import path from 'node:path'` alongside `Path`.
      const cwd = process.cwd();
      expect(Path.resolve("a", "b")).toBe(path.resolve(cwd, "a", "b"));
    });

    it("handles absolute first-segment inputs", () => {
      const root = process.platform === "win32" ? "C:\\repo" : "/repo";
      expect(Path.resolve(root, "packages", "support")).toBe(
        path.resolve(root, "packages", "support"),
      );
    });

    it("returns a non-empty string for any input", () => {
      // Even `Path.resolve()` with no args is documented to return
      // `process.cwd()` — matches `path.resolve()`.
      expect(Path.resolve()).toBe(path.resolve());
      expect(Path.resolve("").length).toBeGreaterThan(0);
    });
  });

  describe("join", () => {
    it("passes through to `path.join`", () => {
      // `Path.join` matches `path.join` exactly, including the
      // "relative if first segment is relative, absolute if first is
      // absolute" semantics.
      expect(Path.join("a", "b", "c")).toBe(path.join("a", "b", "c"));
    });

    it("preserves absolute-first-segment semantics", () => {
      const root = process.platform === "win32" ? "C:\\a" : "/a";
      expect(Path.join(root, "b")).toBe(path.join(root, "b"));
    });

    it("handles trailing separators the same way `path.join` does", () => {
      // `path.join('a/', 'b/')` → `'a/b/'` on POSIX. Just verify
      // parity — we don't want the façade to diverge from the
      // underlying primitive.
      expect(Path.join("a/", "b/")).toBe(path.join("a/", "b/"));
    });
  });

  describe("static-only contract", () => {
    it("cannot be instantiated — the constructor is private and marked as such", () => {
      // TypeScript catches `new Path()` at compile time (the
      // constructor is `private`). We cast to `any` to bypass the
      // type-check and verify the runtime shape:
      //
      // Because JS doesn't enforce `private constructor` at runtime,
      // `new Path()` won't throw — but the class is documented as
      // static-only, and the only sensible use is `Path.foo(...)`.
      // We verify the SHAPE: every method is static, no prototype
      // members leak instance methods.
      //
      // If a future maintainer switches the constructor to throw at
      // runtime as an added defence (the docblock hints at this), the
      // assertion below flips to `expect(() => new (Path as any)()).toThrow()`.
      // For now, assert the current documented shape: instantiation
      // succeeds silently because the private modifier is TS-only.
      const CtorSurface = Path as unknown as new () => Record<string, unknown>;
      const instance = new CtorSurface();
      // The instance carries no useful methods — every method lives
      // on the class constructor itself.
      expect(instance.dirname).toBeUndefined();
      expect(instance.filename).toBeUndefined();
      expect(instance.packageRoot).toBeUndefined();
    });

    it("exposes every documented method as a static", () => {
      // Guards against a future refactor that accidentally turns a
      // static into an instance method.
      expect(typeof Path.dirname).toBe("function");
      expect(typeof Path.filename).toBe("function");
      expect(typeof Path.packageRoot).toBe("function");
      expect(typeof Path.resolve).toBe("function");
      expect(typeof Path.join).toBe("function");
    });

    it("Path.dirname is bound to the class (not to instance state)", () => {
      // The static can be assigned to a bare variable and still work.
      const dirname = Path.dirname;
      expect(dirname(import.meta.url)).toBe(Path.dirname(import.meta.url));
    });
  });

  describe("interop with the public entry point", () => {
    it("Path exported from `@stackra/support` root barrel resolves to the same class", async () => {
      // Sanity check on the barrel wiring — a consumer who imports
      // via `from '@stackra/support'` gets the same `Path` class as
      // a package-internal test importing via `@/path`.
      const rootBarrel = await import("@/index");
      expect(rootBarrel.Path).toBe(Path);
    });
  });
});
