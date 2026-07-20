# `@stackra/console` — stubs

This folder holds the EJS templates every `make:*` command in the workspace
renders. Each stub is one `.ejs` file paired with its owning make command.

## Convention

Every stub obeys three rules:

1. **JSDoc-style header on the stub itself.** The first EJS comment block is a
   JSDoc docblock (`@file` / `@module` / `@description`) describing the stub —
   NOT the file it emits. Add `@template <name>` entries for every EJS variable
   the caller must supply. This surfaces the contract to future stub authors
   without a separate `stubs.md` file.
2. **JSDoc on every export inside the rendered file.** The emitted file starts
   with its own top-of-file JSDoc block (`@file` / `@module` / `@description`),
   and every `export`ed symbol carries its own JSDoc block per
   `.kiro/steering/documentation.md`. Never emit a symbol without one — the
   rendered file is a first-class source file and the same rules apply.
3. **Auto-injected variables.** `StubRenderer` always makes the `Str` façade
   from `@stackra/support` available (`Str.kebab`, `Str.studly`, `Str.slug`,
   ...). Stubs use it for name-shape conversion — never re-derive kebab / studly
   forms inside the stub.

## Layout

```
stubs/
  README.md            ← this file
  command.ejs          ← rendered by `make:command`
  <future>.ejs         ← rendered by `make:<future>` in the same package
```

New stubs land in the owning package's `stubs/` folder — never here unless the
console package itself owns the make command.

## Rendering

```typescript
import { StubRenderer } from "@stackra/console";

// In a MakeXCommand's handle() body:
const { content } = this.stubs.render({
  stub: "command", // → resolves stubs/command.ejs
  packageRoot: PACKAGE_ROOT,
  stubsDir: "stubs", // optional; defaults to 'stubs'
  variables: {
    name: "cache:clear",
    className: "CacheClearCommand",
    description: "Clear the cache.",
    fileName: "cache-clear.command.ts",
    moduleName: "@stackra/cache",
  },
});
```

## Adding a new stub

1. Copy `command.ejs` as the starting shape — you get the JSDoc header + JSDoc
   emit patterns for free.
2. Update `@template` entries to reflect your variables.
3. Update `@example` with the make-command invocation that renders it.
4. Add the new stub to the owning package's `stubs/` folder — never mix stubs
   from multiple packages in one folder.
5. If the stub ships from a package OTHER than `@stackra/console`, remember to
   also register it with `configurePublishables()` on that package's module so
   `vendor:publish` can materialize it into the app.
