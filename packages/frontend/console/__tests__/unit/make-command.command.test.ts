/**
 * @file make-command.command.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `MakeCommandCommand` — the built-in
 *   `stackra make:command` scaffold that renders a new `BaseCommand`
 *   subclass from `stubs/command.ejs`.
 *
 *   Uses a real filesystem sandbox under `os.tmpdir()` — the command
 *   writes files, so exercising the fs path is the whole point of
 *   the tests. Every case cleans up its own sandbox.
 */

import { promises as fs, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { MakeCommandCommand } from "@/commands/make-command.command";
import { StubRenderer } from "@/services/stub-renderer.service";

// ────────────────────────────────────────────────────────────────
// Test doubles + sandbox
// ────────────────────────────────────────────────────────────────

class OutputStub {
  public info = vi.fn<[string], void>();
  public success = vi.fn<[string], void>();
  public error = vi.fn<[string], void>();
  public text = vi.fn<[string, unknown?], Promise<string>>();
  public confirm = vi.fn<[string, unknown?], Promise<boolean>>();
  public pairs = vi.fn<[Record<string, string>], void>();
}

interface ISandbox {
  readonly cwd: string;
  readonly originalCwd: string;
}

async function setupSandbox(): Promise<ISandbox> {
  const originalCwd = process.cwd();
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "make-command-"));
  process.chdir(base);
  return { cwd: base, originalCwd };
}

async function teardownSandbox(sandbox: ISandbox): Promise<void> {
  process.chdir(sandbox.originalCwd);
  await fs.rm(sandbox.cwd, { recursive: true, force: true });
}

function buildCommand(
  stubs: StubRenderer,
  output: OutputStub,
  args: Record<string, unknown>,
  options: Record<string, unknown> = {},
): MakeCommandCommand {
  const cmd = new MakeCommandCommand(stubs);
  (cmd as unknown as { output: OutputStub }).output = output;
  cmd.setArguments(args);
  cmd.setOptions(options);
  cmd.setCommandName("make:command");
  return cmd;
}

// ────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────

describe("MakeCommandCommand", () => {
  let stubs: StubRenderer;
  let output: OutputStub;
  let sandbox: ISandbox;

  beforeEach(async () => {
    stubs = new StubRenderer();
    output = new OutputStub();
    sandbox = await setupSandbox();
  });

  afterEach(async () => {
    await teardownSandbox(sandbox);
  });

  describe("scaffolding — happy path", () => {
    it("renders the stub and writes the file", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache" },
      );

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // File materialised under `src/commands/`, matching the option's default.
      const dest = path.join(sandbox.cwd, "src/commands/cache-clear.command.ts");
      expect(existsSync(dest)).toBe(true);
      const contents = await fs.readFile(dest, "utf-8");
      // The template substitutes `<%= className %>`, `<%= name %>`, etc.
      expect(contents).toContain("CacheClearCommand");
      expect(contents).toContain("cache:clear");
      expect(contents).toContain("Clear the cache");
    });

    it("succeeds without --description by prompting for it", async () => {
      output.text.mockResolvedValueOnce("Auto-described.");

      const cmd = buildCommand(stubs, output, { name: "queue:retry" });
      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      expect(output.text).toHaveBeenCalledTimes(1);
      const contents = await fs.readFile(
        path.join(sandbox.cwd, "src/commands/queue-retry.command.ts"),
        "utf-8",
      );
      expect(contents).toContain("Auto-described.");
    });

    it("emits success + pairs summary on the output", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache" },
      );

      await cmd.handle();

      expect(output.success).toHaveBeenCalled();
      const successMessage = output.success.mock.calls[0]?.[0];
      expect(successMessage).toContain("Command created");
      // The `pairs()` summary is called with a Name / Class / File map.
      expect(output.pairs).toHaveBeenCalled();
      const pairsArg = output.pairs.mock.calls[0]?.[0] as Record<string, string>;
      expect(pairsArg["Name"]).toBe("cache:clear");
      expect(pairsArg["Class"]).toBe("CacheClearCommand");
      expect(pairsArg["File"]).toBe("cache-clear.command.ts");
    });

    it("creates the destination directory if it doesn't exist", async () => {
      // Default `--path=src/commands` — we haven't created it yet.
      expect(existsSync(path.join(sandbox.cwd, "src/commands"))).toBe(false);

      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache" },
      );

      await cmd.handle();

      expect(existsSync(path.join(sandbox.cwd, "src/commands"))).toBe(true);
    });
  });

  describe("existing-file guard", () => {
    it("prompts to confirm overwrite when the target already exists without --force", async () => {
      // Pre-create the file so the guard trips.
      const target = path.join(sandbox.cwd, "src/commands/cache-clear.command.ts");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, "// original content", "utf-8");

      // Simulate the operator saying "no".
      output.confirm.mockResolvedValueOnce(false);

      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache" },
      );

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      expect(output.confirm).toHaveBeenCalledTimes(1);
      // File contents unchanged — confirmed the guard held.
      const contents = await fs.readFile(target, "utf-8");
      expect(contents).toBe("// original content");
    });

    it("bypasses the prompt when --force is passed", async () => {
      const target = path.join(sandbox.cwd, "src/commands/cache-clear.command.ts");
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, "// original content — will be overwritten", "utf-8");

      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache", force: true },
      );

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      // Confirm prompt NEVER fired.
      expect(output.confirm).not.toHaveBeenCalled();
      const contents = await fs.readFile(target, "utf-8");
      expect(contents).not.toContain("original content");
      expect(contents).toContain("CacheClearCommand");
    });
  });

  describe("--path option", () => {
    it("writes to the custom output directory", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "cache:clear" },
        { description: "Clear the cache", path: "app/console" },
      );

      const exitCode = await cmd.handle();

      expect(exitCode).toBe(0);
      const dest = path.join(sandbox.cwd, "app/console/cache-clear.command.ts");
      expect(existsSync(dest)).toBe(true);
    });
  });

  describe("class + file naming", () => {
    it("derives `RouterMountCommand` from `router:mount`", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "router:mount" },
        { description: "Mount the router" },
      );
      await cmd.handle();
      const contents = await fs.readFile(
        path.join(sandbox.cwd, "src/commands/router-mount.command.ts"),
        "utf-8",
      );
      expect(contents).toContain("RouterMountCommand");
    });

    it("handles simple single-word names", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "greet" },
        { description: "Say hello" },
      );
      await cmd.handle();
      const contents = await fs.readFile(
        path.join(sandbox.cwd, "src/commands/greet.command.ts"),
        "utf-8",
      );
      expect(contents).toContain("GreetCommand");
    });

    it("handles compound colon-separated names", async () => {
      const cmd = buildCommand(
        stubs,
        output,
        { name: "db:seed:fresh" },
        { description: "Seed fresh data" },
      );
      await cmd.handle();
      const contents = await fs.readFile(
        path.join(sandbox.cwd, "src/commands/db-seed-fresh.command.ts"),
        "utf-8",
      );
      expect(contents).toContain("DbSeedFreshCommand");
    });
  });
});
