/**
 * @file test-console-output.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the TestConsoleOutput test double.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { TestConsoleOutput } from "@/testing/test-console-output";

describe("TestConsoleOutput", () => {
  let output: TestConsoleOutput;

  beforeEach(() => {
    output = new TestConsoleOutput();
  });

  describe("recording", () => {
    it("should record info calls", () => {
      output.info("Hello world");

      const calls = output.getCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0]?.method).toBe("info");
      expect(calls[0]?.args).toEqual(["Hello world"]);
    });

    it("should record success calls", () => {
      output.success("Done!");

      const calls = output.getCalls();
      expect(calls[0]?.method).toBe("success");
    });

    it("should record error calls", () => {
      output.error("Failed!");

      const calls = output.getCalls();
      expect(calls[0]?.method).toBe("error");
    });

    it("should record warning calls", () => {
      output.warning("Watch out!");

      const calls = output.getCalls();
      expect(calls[0]?.method).toBe("warning");
    });

    it("should record multiple calls in order", () => {
      output.info("first");
      output.success("second");
      output.error("third");

      const calls = output.getCalls();
      expect(calls).toHaveLength(3);
      expect(calls.map((c) => c.method)).toEqual(["info", "success", "error"]);
    });

    it("should record intro and outro", () => {
      output.intro("My App");
      output.outro("Goodbye");

      const calls = output.getCalls();
      expect(calls[0]?.method).toBe("intro");
      expect(calls[1]?.method).toBe("outro");
    });
  });

  describe("assertions", () => {
    it("assertOutputContains should pass when text is present", () => {
      output.info("Hello world");
      output.success("All done");

      expect(() => output.assertOutputContains("Hello")).not.toThrow();
      expect(() => output.assertOutputContains("done")).not.toThrow();
    });

    it("assertOutputContains should fail when text is absent", () => {
      output.info("Hello");

      expect(() => output.assertOutputContains("Goodbye")).toThrow();
    });

    it("assertInfoCalled should pass when info was called", () => {
      output.info("Test");

      expect(() => output.assertInfoCalled()).not.toThrow();
    });

    it("assertInfoCalled with message should match substring", () => {
      output.info("Cache cleared successfully");

      expect(() => output.assertInfoCalled("cleared")).not.toThrow();
      expect(() => output.assertInfoCalled("failed")).toThrow();
    });

    it("assertSuccessCalled should pass when success was called", () => {
      output.success("Done");

      expect(() => output.assertSuccessCalled()).not.toThrow();
      expect(() => output.assertSuccessCalled("Done")).not.toThrow();
    });

    it("assertErrorCalled should pass when error was called", () => {
      output.error("Oops");

      expect(() => output.assertErrorCalled()).not.toThrow();
      expect(() => output.assertErrorCalled("Oops")).not.toThrow();
    });

    it("assertConfirmCalled should pass when confirm was called", async () => {
      await output.confirm("Continue?");

      expect(() => output.assertConfirmCalled()).not.toThrow();
    });

    it("assertSelectCalled should pass when select was called", async () => {
      await output.select("Pick one:", [{ value: "a", label: "A" }]);

      expect(() => output.assertSelectCalled()).not.toThrow();
    });

    it("assertions should fail when method was never called", () => {
      expect(() => output.assertInfoCalled()).toThrow("never invoked");
      expect(() => output.assertSuccessCalled()).toThrow("never invoked");
      expect(() => output.assertErrorCalled()).toThrow("never invoked");
    });
  });

  describe("pre-programmed responses", () => {
    it("should return programmed text response", async () => {
      output.setResponses({ "text:Enter name:": "my-command" });

      const result = await output.text("Enter name:");
      expect(result).toBe("my-command");
    });

    it("should return programmed confirm response", async () => {
      output.setResponses({ "confirm:Overwrite?": false });

      const result = await output.confirm("Overwrite?");
      expect(result).toBe(false);
    });

    it("should return default true for confirm without response", async () => {
      const result = await output.confirm("Continue?");
      expect(result).toBe(true);
    });

    it("should return empty string for text without response", async () => {
      const result = await output.text("Enter something:");
      expect(result).toBe("");
    });

    it("should return first option for select without response", async () => {
      const result = await output.select("Choose:", [
        { value: "first", label: "First" },
        { value: "second", label: "Second" },
      ]);
      expect(result).toBe("first");
    });

    it("should return programmed select response", async () => {
      output.setResponses({ "select:Choose:": "second" });

      const result = await output.select("Choose:", [
        { value: "first", label: "First" },
        { value: "second", label: "Second" },
      ]);
      expect(result).toBe("second");
    });
  });

  describe("reset()", () => {
    it("should clear all recorded calls", () => {
      output.info("test");
      output.success("test");

      output.reset();

      expect(output.getCalls()).toHaveLength(0);
    });

    it("should clear programmed responses", async () => {
      output.setResponses({ "text:Name:": "test" });
      output.reset();

      const result = await output.text("Name:");
      expect(result).toBe(""); // default empty string
    });
  });

  describe("tasks()", () => {
    it("should execute all enabled tasks", async () => {
      const executed: string[] = [];

      await output.tasks([
        {
          title: "Task 1",
          task: async () => {
            executed.push("1");
          },
        },
        {
          title: "Task 2",
          task: async () => {
            executed.push("2");
          },
        },
      ]);

      expect(executed).toEqual(["1", "2"]);
    });

    it("should skip disabled tasks", async () => {
      const executed: string[] = [];

      await output.tasks([
        {
          title: "Task 1",
          task: async () => {
            executed.push("1");
          },
        },
        {
          title: "Task 2",
          task: async () => {
            executed.push("2");
          },
          enabled: false,
        },
        {
          title: "Task 3",
          task: async () => {
            executed.push("3");
          },
        },
      ]);

      expect(executed).toEqual(["1", "3"]);
    });
  });

  describe("spinner()", () => {
    it("should return a no-op spinner", () => {
      const spinner = output.spinner();
      spinner.start("Loading...");
      spinner.stop("Done");

      const calls = output.getCalls();
      expect(calls.some((c) => c.method === "spinner:start")).toBe(true);
      expect(calls.some((c) => c.method === "spinner:stop")).toBe(true);
    });
  });
});
