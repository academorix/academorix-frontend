/**
 * @file console-output.service.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the ConsoleOutput service.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ConsoleOutput } from "@/services/console-output.service";
import { DEFAULT_ICONS } from "@/services/theme.service";

describe("ConsoleOutput", () => {
  let output: ConsoleOutput;
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let ttyBackup: boolean | undefined;

  beforeEach(() => {
    output = new ConsoleOutput();
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    ttyBackup = process.stdout.isTTY;
    // Force non-TTY for predictable output
    Object.defineProperty(process.stdout, "isTTY", { value: false, writable: true });
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    Object.defineProperty(process.stdout, "isTTY", { value: ttyBackup, writable: true });
  });

  describe("info()", () => {
    it("should write with info icon to stdout", () => {
      output.info("Test message");

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${DEFAULT_ICONS.info} Test message`),
      );
    });
  });

  describe("success()", () => {
    it("should write with success icon to stdout", () => {
      output.success("Done!");

      expect(stdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${DEFAULT_ICONS.success} Done!`),
      );
    });
  });

  describe("warning()", () => {
    it("should write with warning icon to stderr", () => {
      output.warning("Careful!");

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${DEFAULT_ICONS.warning} Careful!`),
      );
    });
  });

  describe("error()", () => {
    it("should write with error icon to stderr", () => {
      output.error("Oops!");

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${DEFAULT_ICONS.error} Oops!`),
      );
    });
  });

  describe("newLine()", () => {
    it("should output one newline by default", () => {
      output.newLine();
      expect(stdoutSpy).toHaveBeenCalledWith("\n");
    });

    it("should output multiple newlines", () => {
      output.newLine(3);
      expect(stdoutSpy).toHaveBeenCalledWith("\n\n\n");
    });
  });

  describe("intro()", () => {
    it("should write banner in non-TTY mode", () => {
      output.intro("My App");

      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("=== My App ==="));
    });
  });

  describe("outro()", () => {
    it("should write message in non-TTY mode", () => {
      output.outro("All done!");

      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("All done!"));
    });
  });

  describe("table()", () => {
    it("should render a formatted table with box-drawing characters", () => {
      output.table(
        ["Name", "Version"],
        [
          ["cache", "1.0.0"],
          ["queue", "2.0.0"],
        ],
      );

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Name");
      expect(allOutput).toContain("Version");
      expect(allOutput).toContain("cache");
      expect(allOutput).toContain("queue");
      expect(allOutput).toContain("┌"); // box-drawing top-left
      expect(allOutput).toContain("│"); // box-drawing vertical
      expect(allOutput).toContain("└"); // box-drawing bottom-left
    });
  });

  describe("spinner()", () => {
    it("should return a spinner object in non-TTY mode", () => {
      const s = output.spinner();

      expect(s).toHaveProperty("start");
      expect(s).toHaveProperty("stop");

      s.start("Loading...");
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Loading..."));

      s.stop("Done");
      expect(stdoutSpy).toHaveBeenCalledWith(expect.stringContaining("Done"));
    });
  });

  describe("progress()", () => {
    it("should return a progress bar object", () => {
      const bar = output.progress({ total: 10, message: "Processing" });

      expect(bar).toHaveProperty("increment");
      expect(bar).toHaveProperty("finish");
    });
  });

  describe("interactive methods in non-TTY", () => {
    it("should throw CommandCancelledError for text() in non-TTY", async () => {
      await expect(output.text("Enter name:")).rejects.toThrow(
        "Interactive prompts are not available",
      );
    });

    it("should throw CommandCancelledError for confirm() in non-TTY", async () => {
      await expect(output.confirm("Continue?")).rejects.toThrow(
        "Interactive prompts are not available",
      );
    });

    it("should throw CommandCancelledError for select() in non-TTY", async () => {
      await expect(output.select("Choose:", [{ value: "a", label: "A" }])).rejects.toThrow(
        "Interactive prompts are not available",
      );
    });

    it("should throw CommandCancelledError for multiselect() in non-TTY", async () => {
      await expect(output.multiselect("Choose:", [{ value: "a", label: "A" }])).rejects.toThrow(
        "Interactive prompts are not available",
      );
    });
  });

  describe("enhanced output methods", () => {
    it("step() should write with arrow icon", () => {
      output.step("Installing dependencies");

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Installing dependencies");
      expect(allOutput).toContain(DEFAULT_ICONS.arrow);
    });

    it("pair() should write key-value", () => {
      output.pair("Version", "1.0.0");

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Version");
      expect(allOutput).toContain("1.0.0");
    });

    it("pairs() should write multiple key-value entries", () => {
      output.pairs({ Name: "stackra", Version: "0.1.0", Node: "v24" });

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Name");
      expect(allOutput).toContain("stackra");
      expect(allOutput).toContain("Version");
      expect(allOutput).toContain("0.1.0");
    });

    it("list() should render bulleted items", () => {
      output.list(["First item", "Second item", "Third item"]);

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("First item");
      expect(allOutput).toContain("Second item");
      expect(allOutput).toContain("Third item");
    });

    it("list() with numbered style", () => {
      output.list(["Alpha", "Beta"], { style: "numbered" });

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("1.");
      expect(allOutput).toContain("2.");
      expect(allOutput).toContain("Alpha");
      expect(allOutput).toContain("Beta");
    });

    it("separator() should render a line", () => {
      output.separator();

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain(DEFAULT_ICONS.line);
    });

    it("separator() with label should include it", () => {
      output.separator(40, "Config");

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Config");
    });

    it("json() should render formatted JSON", () => {
      output.json({ name: "test", count: 42 });

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain('"name"');
      expect(allOutput).toContain('"test"');
      expect(allOutput).toContain("42");
    });

    it("box() should render a boxed panel in non-TTY", () => {
      output.box("Title", "Body content here");

      const allOutput = stdoutSpy.mock.calls.map((c: any) => c[0]).join("");
      expect(allOutput).toContain("Title");
      expect(allOutput).toContain("Body content");
    });
  });
});
