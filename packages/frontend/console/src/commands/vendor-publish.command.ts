/**
 * @file vendor-publish.command.ts
 * @module @stackra/console/commands
 * @description The `stackra vendor:publish` command — copy or render
 *   package-owned resource files into the app's working directory.
 *
 *   Mirrors Laravel's `php artisan vendor:publish` shape:
 *
 *   - No `--tag` and no `--all`      → interactive multi-select picker.
 *   - `--tag=<tag>`                  → publish only that tag.
 *   - `--all`                        → publish every registered tag.
 *   - `--force`                      → overwrite existing files.
 *   - `--dry-run`                    → print the source → dest table
 *                                      without touching disk.
 *
 *   `.ejs` sources are rendered through `StubRenderer` (with `Str` from
 *   `@stackra/support` auto-available). Every other extension is copied
 *   byte-for-byte. Callers can force-toggle via `file.render`.
 *
 *   Writes are atomic — the command writes to `<dest>.tmp-<pid>-<rand>`
 *   then renames on success, so a crash mid-write never leaves a
 *   truncated file at the destination.
 */

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";

import type { IPublishableFile, IPublishableRegistryEntry } from "@stackra/contracts";

import { BaseCommand, Command } from "..";
import { PublishableRegistry } from "../publishing/registries/publishable.registry";
import { StubRenderer } from "../services/stub-renderer.service";

/**
 * Result of publishing a single file. Aggregated across every file the
 * command processes and rendered as a summary at the end.
 */
interface IFileResult {
  /** Absolute source path. */
  readonly source: string;
  /** Absolute destination path. */
  readonly dest: string;
  /** What happened. */
  readonly status:
    | "written"
    | "skipped-exists"
    | "skipped-dry-run"
    | "error-permission"
    | "error-source-missing"
    | "error-unknown";
  /** Optional diagnostic message — only set for error / skipped states. */
  readonly note?: string;
}

/**
 * The `stackra vendor:publish` command.
 *
 * Reads the workspace-wide `PublishableRegistry`, filters by the
 * caller's flags, and copies or renders every matching file.
 *
 * @example
 * ```bash
 * # Publish one tag.
 * stackra vendor:publish --tag=routing-config
 *
 * # Publish every tag, overwriting existing files, without prompting.
 * stackra vendor:publish --all --force
 *
 * # Preview only.
 * stackra vendor:publish --tag=routing-config --dry-run
 * ```
 */
@Command({
  name: "vendor:publish",
  description: "Publish package resources (config, stubs, migrations, ...) to the app.",
  options: [
    {
      name: "--tag",
      description: "Publish only entries with this tag.",
      type: "string",
    },
    {
      name: "--all",
      description: "Publish every registered tag without prompting.",
      type: "boolean",
    },
    {
      name: "--force",
      description: "Overwrite existing files at the destination.",
      type: "boolean",
    },
    {
      name: "--dry-run",
      description: "Print the source → destination table without writing.",
      type: "boolean",
    },
  ],
})
export class VendorPublishCommand extends BaseCommand {
  /**
   * @param registry - Populated by `PublishableLoader` at bootstrap.
   *   Contains every publishable declared by every module in the
   *   workspace via `static configurePublishables(consumer)`.
   * @param stubs - Renders `.ejs` sources with the standard template
   *   environment (`Str` from `@stackra/support` auto-injected).
   */
  public constructor(
    private readonly registry: PublishableRegistry,
    private readonly stubs: StubRenderer,
  ) {
    super();
  }

  /**
   * Execute the publish flow. Every code path routes back to
   * `finish(...)` so the summary is printed exactly once.
   */
  public async handle(): Promise<void | number> {
    const tag = this.option<string | undefined>("tag");
    const all = Boolean(this.option<boolean>("all"));
    const force = Boolean(this.option<boolean>("force"));
    const dryRun = Boolean(this.option<boolean>("dry-run"));

    // ── Empty-registry short-circuit ────────────────────────────────
    if (this.registry.size() === 0) {
      this.output.info(
        "No publishable resources are registered in this workspace. " +
          "Add `static configurePublishables(consumer)` to a module class " +
          "(see @stackra/console docs for the shape).",
      );
      return 0;
    }

    // ── Selection ────────────────────────────────────────────────────
    // Three paths — explicit tag, --all, or interactive multi-select.
    // All three converge on a `selected` array we iterate below.
    let selected: readonly IPublishableRegistryEntry[];
    if (tag) {
      // Explicit tag: exactly one entry or a fail-loud "not found".
      const entry = this.registry.byTag(tag);
      if (!entry) {
        this.output.error(
          `No publishable found for tag "${tag}". ` +
            `Run \`stackra vendor:publish\` with no arguments to see the interactive picker.`,
        );
        return 1;
      }
      selected = [entry];
    } else if (all) {
      selected = this.registry.all();
    } else {
      // Interactive: multi-select every registered entry.
      const options = this.registry.all().map((entry) => ({
        value: entry.tag,
        label: entry.tag,
        hint: entry.description ?? "(no description)",
      }));
      const chosen = await this.output.multiselect("Which resources should be published?", options);
      const chosenSet = new Set(chosen);
      selected = this.registry.all().filter((entry) => chosenSet.has(entry.tag));
      // Cancelled or nothing selected — bail without side effects.
      if (selected.length === 0) {
        this.output.warning("Nothing selected — exiting without publishing.");
        return 0;
      }
    }

    // ── Execute ──────────────────────────────────────────────────────
    // Every file across every selected entry contributes one row to
    // the summary. We keep going on individual failures so the operator
    // sees the full picture instead of stopping at the first error.
    const results: IFileResult[] = [];
    for (const entry of selected) {
      for (const file of entry.files) {
        results.push(await this.processFile(entry, file, { force, dryRun }));
      }
    }

    return this.finish(results, { dryRun });
  }

  // ══════════════════════════════════════════════════════════════════
  // Per-file processing
  // ══════════════════════════════════════════════════════════════════

  /**
   * Publish a single file. Returns a result descriptor — never throws.
   *
   * Fail-soft strategy: every filesystem error is caught, categorized,
   * and returned as a `status` in the descriptor. The summary printer
   * decides how loud to be.
   */
  private async processFile(
    entry: IPublishableRegistryEntry,
    file: IPublishableFile,
    flags: { readonly force: boolean; readonly dryRun: boolean },
  ): Promise<IFileResult> {
    const source = path.resolve(entry.packageRoot, file.from);
    // `file.to` is optional in the author-facing interface; the
    // consumer's normalizer fills it with `file.from` when omitted, so
    // the fallback below is defensive but tautological in practice.
    const dest = path.resolve(process.cwd(), file.to ?? file.from);

    // Source-missing is a package-authoring bug (the manifest referenced
    // a file that doesn't exist on disk). Fail-soft — record + continue.
    if (!existsSync(source)) {
      return {
        source,
        dest,
        status: "error-source-missing",
        note: "source file is missing from the package tree",
      };
    }

    // Existing-file guard. `--force` overrides.
    if (existsSync(dest) && !flags.force) {
      return {
        source,
        dest,
        status: "skipped-exists",
        note: "destination already exists (pass --force to overwrite)",
      };
    }

    // Dry-run short-circuit — record the intent without touching disk.
    if (flags.dryRun) {
      return { source, dest, status: "skipped-dry-run" };
    }

    // ── Actual write ────────────────────────────────────────────────
    try {
      await fs.mkdir(path.dirname(dest), { recursive: true });

      const shouldRender = this.shouldRender(file);
      const content = shouldRender ? this.renderStub(source, entry) : await fs.readFile(source);

      await this.atomicWrite(dest, content);
      return { source, dest, status: "written" };
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EACCES" || code === "EPERM") {
        return {
          source,
          dest,
          status: "error-permission",
          note: `permission denied writing to ${dest} — re-run with elevated privileges if the destination requires it`,
        };
      }
      const message = err instanceof Error ? err.message : String(err);
      return {
        source,
        dest,
        status: "error-unknown",
        note: message,
      };
    }
  }

  /**
   * Decide whether a file should be rendered through `StubRenderer`.
   *
   * Explicit `file.render` wins; otherwise `.ejs` → render, anything
   * else → copy verbatim.
   */
  private shouldRender(file: IPublishableFile): boolean {
    if (file.render !== undefined) return file.render;
    return path.extname(file.from) === ".ejs";
  }

  /**
   * Render an `.ejs` stub with the standard template environment.
   *
   * Uses the source's `.ejs` name as the `stub` and passes the file's
   * `packageRoot` so relative includes inside the template resolve.
   * Template variables: the entry's tag + a synthesized `now` timestamp,
   * so stubs that emit "generated at" headers have something to show.
   */
  private renderStub(source: string, entry: IPublishableRegistryEntry): string {
    const stub = path.basename(source, ".ejs");
    const stubsDir = path.dirname(source);
    const { content } = this.stubs.render({
      stub,
      packageRoot: path.dirname(stubsDir),
      stubsDir: path.basename(stubsDir),
      variables: {
        tag: entry.tag,
        description: entry.description ?? "",
        publishedAt: new Date().toISOString(),
      },
    });
    return content;
  }

  /**
   * Write `content` to `dest` atomically.
   *
   * Writes to `<dest>.<pid>-<rand>.tmp` first then renames on success.
   * A crash mid-write leaves the temp file behind (which the operator
   * or a follow-up run can clean up) but never a truncated destination.
   */
  private async atomicWrite(dest: string, content: string | Buffer): Promise<void> {
    // Random suffix + pid keeps concurrent publishes to the same dest
    // from stepping on each other (unlikely but cheap to defend against).
    const suffix = `${process.pid}-${Math.random().toString(36).slice(2, 10)}`;
    const tmp = `${dest}.${suffix}.tmp`;
    await fs.writeFile(tmp, content);
    await fs.rename(tmp, dest);
  }

  // ══════════════════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════════════════

  /**
   * Print a per-file summary + a headline totals line. Returns the
   * command's exit code — non-zero when any file failed.
   */
  private finish(results: readonly IFileResult[], flags: { readonly dryRun: boolean }): number {
    // Human-readable table: source path (relative to cwd for brevity)
    // + dest path (same) + status.
    const rows = results.map((r) => [
      path.relative(process.cwd(), r.source),
      path.relative(process.cwd(), r.dest),
      this.renderStatus(r.status),
      r.note ?? "",
    ]);
    this.output.table(["source", "destination", "status", "note"], rows);

    // Headline totals — one line so CI logs can grep it easily.
    const written = results.filter((r) => r.status === "written").length;
    const skipped = results.filter((r) => r.status.startsWith("skipped-")).length;
    const errored = results.filter((r) => r.status.startsWith("error-")).length;

    if (errored > 0) {
      this.output.error(`${written} written, ${skipped} skipped, ${errored} errored.`);
      return 1;
    }
    if (flags.dryRun) {
      this.output.info(
        `Dry-run — ${results.length} file(s) would be published. Pass --force to overwrite existing ones.`,
      );
      return 0;
    }
    this.output.success(`${written} written, ${skipped} skipped.`);
    return 0;
  }

  /**
   * Map a machine status to a short human-readable badge for the table.
   */
  private renderStatus(status: IFileResult["status"]): string {
    switch (status) {
      case "written":
        return "✓ written";
      case "skipped-exists":
        return "→ exists";
      case "skipped-dry-run":
        return "· dry-run";
      case "error-permission":
        return "✗ perm";
      case "error-source-missing":
        return "✗ missing";
      case "error-unknown":
        return "✗ error";
    }
  }
}
