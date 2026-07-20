/**
 * @file stub-renderer.service.ts
 * @module @stackra/console/services
 * @description EJS-based stub/template renderer for code generation commands.
 *   Loads `.ejs` templates from a package's `stubs/` directory and renders
 *   them with provided variables. Used by all `make:*` commands.
 *
 *   Convention:
 *   - Each package has a `stubs/` folder at its root
 *   - Templates use `.ejs` extension (e.g., `command.ejs`, `entity.ejs`)
 *   - Variables use `<%= varName %>` syntax (standard EJS)
 *   - `Str` from @stackra/support is injected into every template
 *   - Use `<%= Str.studly(name) %>` for PascalCase, `<%= Str.kebab(name) %>` etc.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

import { Injectable } from "@stackra/container";
import { Str } from "@stackra/support";
// ejs ships no type declarations; `@ts-expect-error` would flip to an
// error if @types/ejs were ever added, so `@ts-ignore` is the correct
// long-lived escape here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- ejs has no bundled type declarations.
import ejs from "ejs";

import type { IStubRenderOptions, IStubRenderResult } from "../interfaces";

/**
 * Minimal type surface we consume from `ejs` — kept local so the whole
 * file doesn't need `@ts-expect-error` on every call site.
 */
interface IEjsRenderer {
  render(template: string, data: Record<string, unknown>, options: { filename: string }): string;
}
const ejsRenderer = ejs as unknown as IEjsRenderer;

/**
 * EJS-based stub template renderer.
 *
 * Loads `.ejs` templates from package `stubs/` directories and renders
 * them with provided variables. `Str` from `@stackra/support` is
 * automatically available in every template for string manipulation.
 *
 * @example
 * ```typescript
 * const result = stubRenderer.render({
 *   stub: 'command',
 *   variables: { name: 'cache:clear', description: 'Clear cache' },
 *   packageRoot: '/path/to/console',
 * });
 * // In template: <%= Str.studly(name) %> → CacheClear
 * ```
 */
@Injectable()
export class StubRenderer {
  /**
   * Render a stub template with variables.
   *
   * All templates receive:
   * - All keys from `options.variables`
   * - `Str` — the full `@stackra/support` string utility class
   *
   * @param options - Render options (stub name, variables, package root)
   * @returns The rendered content and source path
   * @throws Error when the template file cannot be found
   */
  public render(options: IStubRenderOptions): IStubRenderResult {
    const templatePath = this.resolveTemplatePath(options);

    if (!existsSync(templatePath)) {
      throw new Error(`Stub template "${options.stub}.ejs" not found at: ${templatePath}`);
    }

    const template = readFileSync(templatePath, "utf-8");
    const content = ejsRenderer.render(
      template,
      {
        ...options.variables,
        Str,
      },
      {
        filename: templatePath,
      },
    );

    return { content, templatePath };
  }

  /**
   * List all available stubs in a package's stubs directory.
   *
   * @param packageRoot - Package root directory
   * @param stubsDir - Custom stubs directory name (default: 'stubs')
   * @returns Array of stub names (without .ejs extension)
   */
  public listStubs(packageRoot: string, stubsDir = "stubs"): string[] {
    const dir = resolve(packageRoot, stubsDir);
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
      .filter((f) => extname(f) === ".ejs")
      .map((f) => basename(f, ".ejs"));
  }

  /**
   * Check if a specific stub exists in a package.
   *
   * @param stub - Stub name (without .ejs)
   * @param packageRoot - Package root directory
   * @param stubsDir - Custom stubs directory name
   * @returns True if the stub file exists
   */
  public hasStub(stub: string, packageRoot: string, stubsDir = "stubs"): boolean {
    const filePath = resolve(packageRoot, stubsDir, `${stub}.ejs`);
    return existsSync(filePath);
  }

  // ==========================================================================
  // Private
  // ==========================================================================

  /**
   * Resolve the full path to a stub template.
   *
   * @param options - Render options
   * @returns Absolute path to the .ejs file
   */
  private resolveTemplatePath(options: IStubRenderOptions): string {
    const stubsDir = options.stubsDir ?? "stubs";
    const packageRoot = options.packageRoot ?? process.cwd();
    return resolve(packageRoot, stubsDir, `${options.stub}.ejs`);
  }
}
