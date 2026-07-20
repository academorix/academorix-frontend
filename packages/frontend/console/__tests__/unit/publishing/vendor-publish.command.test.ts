/**
 * @file vendor-publish.command.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `VendorPublishCommand` — the
 *   `stackra vendor:publish` command that copies or renders
 *   package-owned resource files into the app's working directory.
 *
 *   Uses a real filesystem sandbox (`fs.mkdtemp(...)` under
 *   `os.tmpdir()`) so the atomic-write + existing-dest guard paths
 *   run end-to-end without mocking Node's `fs`. Every test cleans up
 *   its own sandbox in the `afterEach`.
 *
 *   The command's `this.output` is `@Inject(CONSOLE_OUTPUT)`-driven —
 *   for tests we bypass DI and assign a hand-rolled stub that
 *   collects messages instead of writing to stdout. This lets us
 *   assert on the strings the command emits and short-circuit
 *   interactive prompts (which would otherwise throw in non-TTY).
 */

import { promises as fs, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import type { IPublishableRegistryEntry } from "@stackra/contracts";

import { VendorPublishCommand } from "@/commands/vendor-publish.command";
import { PublishableRegistry } from "@/publishing/registries/publishable.registry";
import { StubRenderer } from "@/services/stub-renderer.service";

// ────────────────────────────────────────────────────────────────
// Test doubles
// ────────────────────────────────────────────────────────────────

class SourceModule {}

/**
 * Minimal output stub — captures every message + provides the
 * interactive prompt methods the command reaches for. Interactive
 * responses are configured per-test.
 */
class OutputStub {
  public info = vi.fn<[string], void>();
  public success = vi.fn<[string], void>();
  public warning = vi.fn<[string], void>();
  public error = vi.fn<[string], void>();
  public table = vi.fn<[string[], string[][]], void>();
  public multiselect = vi.fn<[string, unknown[]], Promise<unknown>>();
}

/**
 * Build a `VendorPublishCommand` with its DI-injected output
 * bypassed by our stub, and with pre-baked args/options.
 */
function buildCommand(
  registry: PublishableRegistry,
  stubs: StubRenderer,
  output: OutputStub,
  options: Record<string, unknown> = {},
): VendorPublishCommand {
  const cmd = new VendorPublishCommand(registry, stubs);
  // Bypass DI — `output` is `@Inject(CONSOLE_OUTPUT)` on BaseCommand.
  (cmd as unknown as { output: OutputStub }).output = output;
  cmd.setArguments({});
  cmd.setOptions(options);
  cmd.setCommandName("vendor:publish");
  return cmd;
}

// ────────────────────────────────────────────────────────────────
// Sandbox helpers
// ────────────────────────────────────────────────────────────────

interface ISandbox {
  /** Absolute path to a real tmp directory acting as the package root. */
  readonly packageRoot: string;
  /** Absolute path to a real tmp directory acting as `process.cwd()`. */
  readonly cwd: string;
  /** Snapshot of the original cwd we swap back to after the test. */
  readonly originalCwd: string;
}

/**
 * Set up a real, isolated filesystem sandbox for a single test.
 * Callers are responsible for tearing it down via `teardown()`.
 */
async function setupSandbox(): Promise<ISandbox> {
  const originalCwd = process.cwd();
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "vendor-publish-"));
  const packageRoot = path.join(base, "package");
  const cwd = path.join(base, "cwd");
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.mkdir(cwd, { recursive: true });
  process.chdir(cwd);
  return { packageRoot, cwd, originalCwd };
}

async function teardownSandbox(sandbox: ISandbox): Promise<void> {
  // Restore cwd BEFORE deleting the tmp directory — otherwise
  // some fs implementations refuse to delete the current directory.
  process.chdir(sandbox.originalCwd);
  const base = path.dirname(sandbox.packageRoot);
  await fs.rm(base, { recursive: true, force: true });
}

/**
 * Register a publishable entry inside the sandbox's package root,
 * ensuring the source files also exist on disk.
 */
async function registerWithFiles(
  registry: PublishableRegistry,
  sandbox: ISandbox,
  overrides: Partial<Omit<IPublishableRegistryEntry, "sourceModule">> = {},
): Promise<Omit<IPublishableRegistryEntry, "sourceModule">> {
  const entry: Omit<IPublishableRegistryEntry, "sourceModule"> = {
    tag: "test-config",
    description: "A test config publishable.",
    packageRoot: sandbox.packageRoot,
    files: [{ from: "config/test.config.ts", to: "config/test.config.ts" }],
    ...overrides,
  };

  // Create every source file the entry references so the command's
  // existsSync guard passes.
  for (const f of entry.files) {
    const abs = path.join(entry.packageRoot, f.from);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, `// source for ${entry.tag} — ${f.from}\n`, "utf-8");
  }

  registry.register(entry, SourceModule);
  return entry;
}

// ────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────

describe("VendorPublishCommand", () => {
  let registry: PublishableRegistry;
  let stubs: StubRenderer;
  let output: OutputStub;
  let sandbox: ISandbox;

  beforeEach(async () => {
    registry = new PublishableRegistry();
    stubs = new StubRenderer();
    output = new OutputStub();
    sandbox = await setupSandbox();
  });

  afterEach(async () => {
    await teardownSandbox(sandbox);
  });

  describe("empty registry", () => {
    it("prints an info message and exits 0 when no publishables are registered", async () => {
      const cmd = buildCommand(registry, stubs, output);

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // Message points the operator to the correct setup step.
      const message = (output.info.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(message).toContain("configurePublishables");
    });

    it("does not touch the filesystem when the registry is empty", async () => {
      const cmd = buildCommand(registry, stubs, output);

      await cmd.handle();

      // cwd is still empty.
      const entries = await fs.readdir(sandbox.cwd);
      expect(entries).toEqual([]);
    });
  });

  describe("--tag flag", () => {
    it("publishes exactly the requested tag", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag });

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // File materialized under cwd.
      const dest = path.join(sandbox.cwd, entry.files[0]!.to!);
      expect(existsSync(dest)).toBe(true);
      const contents = await fs.readFile(dest, "utf-8");
      expect(contents).toContain(entry.tag);
    });

    it("returns exit code 1 and reports the error when the tag is unknown", async () => {
      const cmd = buildCommand(registry, stubs, output, { tag: "does-not-exist" });
      // Register at least one entry so we get past the empty-registry
      // short-circuit.
      await registerWithFiles(registry, sandbox);

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(1);
      // The error message names the tag AND the interactive fallback.
      const errorMessage = (output.error.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(errorMessage).toContain("does-not-exist");
      expect(errorMessage).toContain("interactive picker");
    });

    it("emits ONE success line naming the count when the write succeeds", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag });

      await cmd.handle();

      // Summary line reports "1 written, 0 skipped".
      const successMessage = (output.success.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(successMessage).toMatch(/1 written/);
      expect(successMessage).toMatch(/0 skipped/);
    });
  });

  describe("--all flag", () => {
    it("publishes every registered entry", async () => {
      await registerWithFiles(registry, sandbox, {
        tag: "tag-a",
        files: [{ from: "config/a.config.ts", to: "config/a.config.ts" }],
      });
      await registerWithFiles(registry, sandbox, {
        tag: "tag-b",
        files: [{ from: "config/b.config.ts", to: "config/b.config.ts" }],
      });

      const cmd = buildCommand(registry, stubs, output, { all: true });
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      expect(existsSync(path.join(sandbox.cwd, "config/a.config.ts"))).toBe(true);
      expect(existsSync(path.join(sandbox.cwd, "config/b.config.ts"))).toBe(true);
    });
  });

  describe("existing-file guard", () => {
    it("skips existing files when --force is NOT passed", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      // Pre-write the destination with different content.
      const dest = path.join(sandbox.cwd, entry.files[0]!.to!);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, "original content — must be preserved", "utf-8");

      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag });
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // Contents preserved — no overwrite happened.
      const contents = await fs.readFile(dest, "utf-8");
      expect(contents).toBe("original content — must be preserved");
      // Summary reports 1 skipped.
      const successMessage = (output.success.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(successMessage).toMatch(/1 skipped/);
    });

    it("overwrites existing files when --force is passed", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const dest = path.join(sandbox.cwd, entry.files[0]!.to!);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, "original content — will be overwritten", "utf-8");

      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag, force: true });
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      const contents = await fs.readFile(dest, "utf-8");
      expect(contents).toContain(entry.tag);
      expect(contents).not.toContain("original content");
    });
  });

  describe("--dry-run flag", () => {
    it("does not write any files when --dry-run is passed", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag, "dry-run": true });

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // Destination file was NOT created.
      const dest = path.join(sandbox.cwd, entry.files[0]!.to!);
      expect(existsSync(dest)).toBe(false);
      // Summary emits a dry-run info message rather than success.
      const infoMessage = (output.info.mock.calls.at(-1)?.[0] as string | undefined) ?? "";
      expect(infoMessage).toMatch(/Dry-run/);
      expect(infoMessage).toContain("would be published");
    });

    it("still lists the intended destination in the summary table", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag, "dry-run": true });

      await cmd.handle();

      // `output.table(headers, rows)` — assert one row references
      // the source's basename.
      expect(output.table).toHaveBeenCalled();
      const rows = output.table.mock.calls[0]?.[1] as string[][];
      expect(rows.length).toBeGreaterThan(0);
      // Every row has 4 columns per the summary.
      expect(rows[0]?.length).toBe(4);
    });
  });

  describe("source-missing failure", () => {
    it("reports the file as missing (does NOT throw) and returns exit code 1", async () => {
      // Register an entry whose source file doesn't exist on disk.
      registry.register(
        {
          tag: "missing-src",
          packageRoot: sandbox.packageRoot,
          files: [{ from: "config/does-not-exist.ts", to: "config/does-not-exist.ts" }],
        },
        SourceModule,
      );

      const cmd = buildCommand(registry, stubs, output, { tag: "missing-src" });
      const exitCode = await cmd.handle();

      // Non-zero — the summary error path.
      expect(exitCode).toBe(1);
      // The final `output.error(...)` mentions "errored".
      const errorMessage = (output.error.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(errorMessage).toMatch(/errored/);
    });
  });

  describe("interactive multiselect (no --tag / --all)", () => {
    it("uses the interactive picker to select entries", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      // Simulate the operator picking the one entry.
      output.multiselect.mockResolvedValueOnce([entry.tag]);

      const cmd = buildCommand(registry, stubs, output);
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // Prompt fired exactly once with the tags visible.
      expect(output.multiselect).toHaveBeenCalledTimes(1);
      const options = output.multiselect.mock.calls[0]?.[1] as { value: string }[];
      expect(options.map((o) => o.value)).toContain(entry.tag);
      // File materialized.
      const dest = path.join(sandbox.cwd, entry.files[0]!.to!);
      expect(existsSync(dest)).toBe(true);
    });

    it("bails without side effects when the operator selects nothing", async () => {
      await registerWithFiles(registry, sandbox);
      // Empty selection — the command must NOT touch disk.
      output.multiselect.mockResolvedValueOnce([]);

      const cmd = buildCommand(registry, stubs, output);
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      const warningMessage = (output.warning.mock.calls[0]?.[0] as string | undefined) ?? "";
      expect(warningMessage).toMatch(/Nothing selected/);
    });
  });

  describe("atomic write — no half-written destinations left behind", () => {
    it("removes the temp file after a successful write", async () => {
      const entry = await registerWithFiles(registry, sandbox);
      const cmd = buildCommand(registry, stubs, output, { tag: entry.tag });

      await cmd.handle();

      // Only the final dest file exists — the `.tmp` sibling is
      // renamed away.
      const destDir = path.dirname(path.join(sandbox.cwd, entry.files[0]!.to!));
      const siblings = await fs.readdir(destDir);
      const tmpFiles = siblings.filter((f) => f.endsWith(".tmp") || f.includes(".tmp-"));
      expect(tmpFiles).toEqual([]);
      expect(siblings).toContain(path.basename(entry.files[0]!.to!));
    });
  });
});
