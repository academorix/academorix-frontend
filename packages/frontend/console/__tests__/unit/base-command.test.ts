/**
 * @file base-command.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the BaseCommand abstract class.
 */

import { describe, it, expect, vi } from "vitest";
import { BaseCommand } from "@/base";
import { MissingArgumentError } from "@/errors";

// Concrete test implementation
class TestCommand extends BaseCommand {
  public handleFn = vi.fn<[], Promise<void | number>>().mockResolvedValue(undefined);
  public afterHandleFn = vi.fn<[], Promise<void>>().mockResolvedValue(undefined);

  public async handle(): Promise<void | number> {
    return this.handleFn();
  }

  public override async afterHandle(): Promise<void> {
    return this.afterHandleFn();
  }

  // Expose protected methods for testing
  public getArgument<T = string>(name: string): T {
    return this.argument<T>(name);
  }

  public getArgumentOptional<T = string>(name: string): T | undefined {
    return this.argumentOptional<T>(name);
  }

  public getOption<T = unknown>(name: string): T {
    return this.option<T>(name);
  }
}

describe("BaseCommand", () => {
  describe("argument()", () => {
    it("should return the argument value when present", () => {
      const cmd = new TestCommand();
      cmd.setArguments({ name: "cache", path: "/tmp" });
      cmd.setCommandName("test:cmd");

      expect(cmd.getArgument("name")).toBe("cache");
      expect(cmd.getArgument("path")).toBe("/tmp");
    });

    it("should throw MissingArgumentError when argument is missing", () => {
      const cmd = new TestCommand();
      cmd.setArguments({});
      cmd.setCommandName("config:publish");

      expect(() => cmd.getArgument("package")).toThrow(MissingArgumentError);
      expect(() => cmd.getArgument("package")).toThrow("config:publish");
    });

    it("should throw when argument value is null", () => {
      const cmd = new TestCommand();
      cmd.setArguments({ name: null });
      cmd.setCommandName("test:cmd");

      expect(() => cmd.getArgument("name")).toThrow(MissingArgumentError);
    });
  });

  describe("argumentOptional()", () => {
    it("should return undefined for missing arguments", () => {
      const cmd = new TestCommand();
      cmd.setArguments({});

      expect(cmd.getArgumentOptional("missing")).toBeUndefined();
    });

    it("should return the value when present", () => {
      const cmd = new TestCommand();
      cmd.setArguments({ name: "test" });

      expect(cmd.getArgumentOptional("name")).toBe("test");
    });
  });

  describe("option()", () => {
    it("should return the option value when present", () => {
      const cmd = new TestCommand();
      cmd.setOptions({ force: true, count: 5 });

      expect(cmd.getOption<boolean>("force")).toBe(true);
      expect(cmd.getOption<number>("count")).toBe(5);
    });

    it("should return undefined for missing options", () => {
      const cmd = new TestCommand();
      cmd.setOptions({});

      expect(cmd.getOption("missing")).toBeUndefined();
    });
  });

  describe("run()", () => {
    it("should call handle() and afterHandle() in sequence", async () => {
      const cmd = new TestCommand();
      const callOrder: string[] = [];

      cmd.handleFn.mockImplementation(async () => {
        callOrder.push("handle");
      });
      cmd.afterHandleFn.mockImplementation(async () => {
        callOrder.push("afterHandle");
      });

      await cmd.run({}, {});

      expect(callOrder).toEqual(["handle", "afterHandle"]);
    });

    it("should return 0 when handle() returns void", async () => {
      const cmd = new TestCommand();
      cmd.handleFn.mockResolvedValue(undefined);

      const exitCode = await cmd.run({}, {});
      expect(exitCode).toBe(0);
    });

    it("should return the numeric exit code from handle()", async () => {
      const cmd = new TestCommand();
      cmd.handleFn.mockResolvedValue(42);

      const exitCode = await cmd.run({}, {});
      expect(exitCode).toBe(42);
    });

    it("should pass arguments and options to the command", async () => {
      const cmd = new TestCommand();
      cmd.handleFn.mockImplementation(async () => {
        // Access args/options inside handle
        expect(cmd.getArgument("name")).toBe("hello");
        expect(cmd.getOption("force")).toBe(true);
      });

      await cmd.run({ name: "hello" }, { force: true });
    });

    it("should propagate errors from handle()", async () => {
      const cmd = new TestCommand();
      cmd.handleFn.mockRejectedValue(new Error("Something broke"));

      await expect(cmd.run({}, {})).rejects.toThrow("Something broke");
    });

    it("should not call afterHandle() if handle() throws", async () => {
      const cmd = new TestCommand();
      cmd.handleFn.mockRejectedValue(new Error("fail"));

      try {
        await cmd.run({}, {});
      } catch {}

      expect(cmd.afterHandleFn).not.toHaveBeenCalled();
    });
  });
});
