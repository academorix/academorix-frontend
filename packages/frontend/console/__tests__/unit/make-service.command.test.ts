/**
 * @file make-service.command.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for `MakeServiceCommand` — scaffolds a new
 *   `@Injectable` service class from `stubs/service.ejs`.
 */

import { promises as fs, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { MakeServiceCommand } from "@/commands/make-service.command";
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
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "make-service-"));
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
): MakeServiceCommand {
  const cmd = new MakeServiceCommand(stubs);
  (cmd as unknown as { output: OutputStub }).output = output;
  cmd.setArguments(args);
  cmd.setOptions(options);
  cmd.setCommandName("make:service");
  return cmd;
}

describe("MakeServiceCommand", () => {
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

  it("renders the service stub and writes it to the default `src/services/` directory", async () => {
    const cmd = buildCommand(
      stubs,
      output,
      { name: "route-registry" },
      {
        description: "Central registry of every route in the app.",
        module: "@stackra/routing/core/services",
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    const dest = path.join(sandbox.cwd, "src/services/route-registry.service.ts");
    expect(existsSync(dest)).toBe(true);
    const contents = await fs.readFile(dest, "utf-8");
    expect(contents).toContain("RouteRegistryService");
    // The service stub imports `@Injectable` from `@stackra/container`.
    expect(contents).toContain("@Injectable");
    expect(contents).toContain("@stackra/container");
    // Description gets weaved into the JSDoc.
    expect(contents).toContain("Central registry of every route in the app.");
  });

  it("prompts for description + module when they aren't supplied", async () => {
    output.text
      .mockResolvedValueOnce("Auto-described service.")
      .mockResolvedValueOnce("@stackra/example/services");

    const cmd = buildCommand(stubs, output, { name: "route-registry" });
    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.text).toHaveBeenCalledTimes(2);
    const contents = await fs.readFile(
      path.join(sandbox.cwd, "src/services/route-registry.service.ts"),
      "utf-8",
    );
    expect(contents).toContain("Auto-described service.");
    expect(contents).toContain("@stackra/example/services");
  });

  it("prompts for overwrite confirmation when the target already exists", async () => {
    const target = path.join(sandbox.cwd, "src/services/route-registry.service.ts");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "// original content", "utf-8");

    output.confirm.mockResolvedValueOnce(false);

    const cmd = buildCommand(
      stubs,
      output,
      { name: "route-registry" },
      {
        description: "Registry",
        module: "@stackra/routing/services",
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.confirm).toHaveBeenCalledTimes(1);
    // File contents unchanged.
    const contents = await fs.readFile(target, "utf-8");
    expect(contents).toBe("// original content");
  });

  it("overwrites without prompting when --force is set", async () => {
    const target = path.join(sandbox.cwd, "src/services/route-registry.service.ts");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, "// original content — will be overwritten", "utf-8");

    const cmd = buildCommand(
      stubs,
      output,
      { name: "route-registry" },
      {
        description: "Registry",
        module: "@stackra/routing/services",
        force: true,
      },
    );

    const exitCode = await cmd.handle();

    expect(exitCode).toBe(0);
    expect(output.confirm).not.toHaveBeenCalled();
    const contents = await fs.readFile(target, "utf-8");
    expect(contents).not.toContain("original content");
    expect(contents).toContain("RouteRegistryService");
  });

  it("writes to the custom `--path` when supplied", async () => {
    const cmd = buildCommand(
      stubs,
      output,
      { name: "route-registry" },
      {
        description: "Registry",
        module: "@stackra/routing/services",
        path: "app/support",
      },
    );

    await cmd.handle();

    const dest = path.join(sandbox.cwd, "app/support/route-registry.service.ts");
    expect(existsSync(dest)).toBe(true);
  });

  it("derives PascalCase class names regardless of input casing", async () => {
    // Str.studly should convert kebab, snake, and space-separated
    // inputs into the same PascalCase output.
    const cases: [string, string][] = [
      ["snake_case_service", "SnakeCaseServiceService"],
      ["route-registry", "RouteRegistryService"],
      ["metric_reporter", "MetricReporterService"],
    ];
    for (const [name, expected] of cases) {
      const localOutput = new OutputStub();
      const cmd = buildCommand(
        stubs,
        localOutput,
        { name },
        { description: "Test", module: "@stackra/x/services" },
      );
      await cmd.handle();
      // Compute the emitted file path (Str.kebab consumes all seps).
      const kebab = name.replace(/_/g, "-");
      const contents = await fs.readFile(
        path.join(sandbox.cwd, `src/services/${kebab}.service.ts`),
        "utf-8",
      );
      expect(contents).toContain(expected);
    }
  });
});
