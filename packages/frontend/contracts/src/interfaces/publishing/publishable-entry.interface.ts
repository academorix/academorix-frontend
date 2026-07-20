/**
 * @file publishable-entry.interface.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description The full manifest for a single publishable tag — what tag
 *   name to expose to the CLI, where the source files live, and what to
 *   copy or render.
 */

import type { IPublishableFile } from "./publishable-file.interface";

/**
 * A single item in `IPublishableEntry.files`.
 *
 * Two forms:
 *  - **Shorthand `string`** — the file's path relative to the package
 *    root. The destination mirrors the source path exactly (a file at
 *    `config/queue.config.ts` in the package materializes at
 *    `config/queue.config.ts` in the consumer app). This is the
 *    default and covers virtually every real case.
 *  - **Object form `IPublishableFile`** — full control: override the
 *    destination via `to`, force template rendering via `render`.
 *    Reserved for the rare "publish to a different destination path"
 *    or "force-render a non-`.ejs` file" cases.
 */
export type PublishableFileSpec = string | IPublishableFile;

/**
 * One publishable entry — the unit
 * `configurePublishables(consumer)` registers via
 * `consumer.publish(entry)`.
 *
 * A single module can register any number of these; each corresponds to
 * one `--tag=<tag>` invocation of `stackra vendor:publish`.
 */
export interface IPublishableEntry {
  /**
   * Unique tag — passed via `--tag=<tag>` at the CLI. Tags are unique
   * across the whole workspace; the registry rejects duplicates.
   *
   * Naming convention: `<package>-<kind>` — e.g. `routing-config`,
   * `queue-stubs`, `ui-brand-assets`. Kebab-case; at least one hyphen.
   */
  readonly tag: string;

  /**
   * Human-readable description shown in the interactive multi-select
   * fallback.
   */
  readonly description?: string;

  /**
   * Absolute filesystem path to the package root.
   *
   * **Preferred**: declare `public static readonly PACKAGE_ROOT` on the
   * module class and let `PublishableConsumer` auto-read it — so this
   * field can be OMITTED from every `.publish(entry)` call the module
   * makes:
   *
   * ```typescript
   * export class QueueModule {
   *   public static readonly PACKAGE_ROOT = path.resolve(
   *     path.dirname(fileURLToPath(import.meta.url)),
   *     '../../..',
   *   );
   *
   *   public static configurePublishables(consumer: IPublishableConsumer): void {
   *     consumer.publish({
   *       tag: 'queue-config',
   *       // packageRoot omitted — resolved from QueueModule.PACKAGE_ROOT
   *       files: [{ from: 'config/queue.config.ts', to: 'config/queue.config.ts' }],
   *     });
   *   }
   * }
   * ```
   *
   * **Explicit override**: still supported when a module needs to
   * publish files from outside its own tree (rare — mostly test
   * fixtures). When set here, it wins over `M.PACKAGE_ROOT`.
   *
   * **Failure mode**: if BOTH the entry omits this field AND the module
   * class doesn't expose `PACKAGE_ROOT`, the registry throws
   * `InvalidPublishableEntryError` at register time, naming the module.
   */
  readonly packageRoot?: string;

  /**
   * Files this publishable ships. At least one — a publishable with zero
   * files is meaningless.
   *
   * Each entry is either a **string** (path relative to `packageRoot`;
   * destination mirrors the same relative path in the consumer app) or
   * an **object** (`IPublishableFile`) for full control over the
   * destination + rendering behaviour.
   *
   * ```typescript
   * // Simplest form — destination mirrors source:
   * files: ['config/queue.config.ts', 'stubs/processor.ejs']
   *
   * // With override — publish to a different destination:
   * files: [{ from: 'stubs/processor.ejs', to: 'app/stubs/processor.ejs' }]
   *
   * // Mixed:
   * files: [
   *   'config/queue.config.ts',
   *   { from: 'stubs/processor.ejs', render: false },
   * ]
   * ```
   */
  readonly files: readonly PublishableFileSpec[];
}
