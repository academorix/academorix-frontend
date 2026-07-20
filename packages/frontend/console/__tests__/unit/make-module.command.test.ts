/**
 * @file make-module.command.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `MakeModuleCommand` — scaffolds a new
 *   `@Module`-decorated class with `forRoot(...)` +
 *   `configurePublishables(...)` from `stubs/module.ejs`.
 */

import { promises as fs, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { MakeModuleCommand } from "@/commands/make-module.command";
import { StubRenderer } from "@/services/stub-renderer.service";

class OutputStub {
  public info = vi.fn<[string], void>();
  public success = vi.fn<[string], void>();
  public text = vi.fn<[string, unknown?], Promise<string>>();
  public confirm = vi.fn<[string, unknown?], Promise<boolean>>();
}

interface ISandbox {
  readonly cwd: string;
  readonly originalCwd: string;
}

async function setupSandbox(): Promise<ISandbox> {
  const originalCwd = process.cwd();
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "make-module-"));
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
): MakeModuleCommand {
  const cmd = new MakeModuleCommand(stubs);
  (cmd as unknown as { output: OutputStub }).output = output;
  cmd.setArguments(args);
  cmd.setOptions(options);
  cmd.setCommandName("make:module");
  return cmd;
}

describe("MakeModuleCommand", () => {
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

  it("renders the module stub with `forRoot` + `configurePublishables` scaffolding", async () => {
    const cmd = buildCommand(
      stubs,
      output,
      { name: "notifications" },
      {
        description: "Push notification module.",
        module: "@stackra/notifications/core",
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    const dest = path.join(sandbox.cwd, "src/core/notifications.module.ts");
    expect(existsSync(dest)).toBe(true);
    const contents = await fs.readFile(dest, "utf-8");
    // Class name PascalCase-derived from the kebab-case argument.
    expect(contents).toContain("NotificationsModule");
    // `@Module({})` decorator is emitted.
    expect(contents).toContain("@Module");
    // `configurePublishables` is scaffolded.
    expect(contents).toContain("configurePublishables");
    // `forRoot` is scaffolded.
    expect(contents).toContain("forRoot");
    // Description weaved into JSDoc.
    expect(contents).toContain("Push notification module.");
  });

  it("emits success + follow-up hint on the output", async () => {
    const cmd = buildCommand(
      stubs,
      output,
      { name: "notifications" },
      {
        description: "Push notification module.",
        module: "@stackra/notifications/core",
      },
    );

    await cmd.handle();

    expect(output.success).toHaveBeenCalled();
    const successMessage = output.success.mock.calls[0]?.[0];
    expect(successMessage).toContain("Module created");
    // Follow-up nudge about wiring it into AppModule.
    const infoMessage = output.info.mock.calls[0]?.[0];
    expect(infoMessage).toContain("AppModule");
    expect(infoMessage).toContain("forRoot()");
  });

  it("prompts for description + module scope when they aren't supplied", async () => {
    output.text
      .mockResolvedValueOnce("Auto-described.")
      .mockResolvedValueOnce("@stackra/auto/core");

    const cmd = buildCommand(stubs, output, { name: "notifications" });
    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.text).toHaveBeenCalledTimes(2);
    const contents = await fs.readFile(
      path.join(sandbox.cwd, "src/core/notifications.module.ts"),
      "utf-8",
    );
    expect(contents).toContain("Auto-described.");
    expect(contents).toContain("@stackra/auto/core");
  });

  it("prompts for overwrite confirmation when the target already exists", async () => {
    const target = path.join(sandbox.cwd, "src/core/notifications.module.ts");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "// original content", "utf-8");

    output.confirm.mockResolvedValueOnce(false);

    const cmd = buildCommand(
      stubs,
      output,
      { name: "notifications" },
      {
        description: "Push notifications",
        module: "@stackra/notifications/core",
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.confirm).toHaveBeenCalledTimes(1);
    const contents = await fs.readFile(target, "utf-8");
    expect(contents).toBe("// original content");
  });

  it("overwrites without prompting when --force is set", async () => {
    const target = path.join(sandbox.cwd, "src/core/notifications.module.ts");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "// original", "utf-8");

    const cmd = buildCommand(
      stubs,
      output,
      { name: "notifications" },
      {
        description: "Notifications",
        module: "@stackra/notifications/core",
        force: true,
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.confirm).not.toHaveBeenCalled();
    const contents = await fs.readFile(target, "utf-8");
    expect(contents).not.toContain("// original");
    expect(contents).toContain("NotificationsModule");
  });

  it("writes to the custom `--path` when supplied", async () => {
    const cmd = buildCommand(
      stubs,
      output,
      { name: "notifications" },
      {
        description: "Notifications",
        module: "@stackra/notifications/core",
        path: "app/modules",
      },
    );

    await cmd.handle();

    const dest = path.join(sandbox.cwd, "app/modules/notifications.module.ts");
    expect(existsSync(dest)).toBe(true);
  });

  it("derives PascalCase class names via `Str.studly`", async () => {
    const cases: Array<[string, string]> = [
      ["notifications", "NotificationsModule"],
      ["user-profile", "UserProfileModule"],
      ["multi-word-thing", "MultiWordThingModule"],
    ];
    for (const [name, expected] of cases) {
      const localOutput = new OutputStub();
      const cmd = buildCommand(
        stubs,
        localOutput,
        { name },
        { description: "Test.", module: "@stackra/x/core" },
      );
      await cmd.handle();
      // File-name normalizer uses `Str.kebab` (same input kebab-case → same file).
      const contents = await fs.readFile(
        path.join(sandbox.cwd, `src/core/${name}.module.ts`),
        "utf-8",
      );
      expect(contents).toContain(expected);
    }
  });
});
