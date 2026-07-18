/**
 * @file stub-render-options.interface.ts
 * @module @stackra/console/interfaces
 * @description Options accepted by `StubRenderer#render(...)` — chooses the
 *   template, supplies its variables, and locates the package root that
 *   houses the `stubs/` folder.
 */

/**
 * Options bag for a single stub render. All fields except `stub` and
 * `variables` are optional and default sensibly for the common case where
 * the caller runs from its own package root and uses the `stubs/`
 * convention.
 */
export interface IStubRenderOptions {
  /** Stub name without the `.ejs` extension (e.g. `"command"`, `"entity"`). */
  readonly stub: string;

  /**
   * Variables handed to the template. Every value is available as
   * `<%= key %>` inside the EJS source. `Str` from `@stackra/support` is
   * automatically added by the renderer — never pass it as a variable.
   */
  readonly variables: Readonly<Record<string, unknown>>;

  /**
   * Absolute path to the package root that owns the `stubs/` folder.
   * Defaults to `process.cwd()` when omitted.
   */
  readonly packageRoot?: string;

  /**
   * Subdirectory name inside `packageRoot` that holds the templates.
   * Defaults to `"stubs"` when omitted.
   */
  readonly stubsDir?: string;
}
