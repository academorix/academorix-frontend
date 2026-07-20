import { describe, it, expect } from "vitest";

import { parseArgv } from "@/utils/argv-parser.util";

describe("parseArgv", () => {
  it("should parse command name", () => {
    const result = parseArgv(["migration:run"]);
    expect(result.commandName).toBe("migration:run");
    expect(result.args).toEqual({});
    expect(result.options).toEqual({});
  });

  it("should parse long options with values", () => {
    const result = parseArgv(["migration:run", "--to", "Migration20250601"]);
    expect(result.commandName).toBe("migration:run");
    expect(result.options.to).toBe("Migration20250601");
  });

  it("should parse long boolean flags", () => {
    const result = parseArgv(["db:seed", "--verbose"]);
    expect(result.options.verbose).toBe(true);
  });

  it("should parse short options with values", () => {
    const result = parseArgv(["migration:run", "-t", "Migration20250601"]);
    expect(result.options.t).toBe("Migration20250601");
  });

  it("should parse short boolean flags", () => {
    const result = parseArgv(["db:seed", "-v"]);
    expect(result.options.v).toBe(true);
  });

  it("should parse combined short flags", () => {
    const result = parseArgv(["cmd", "-vf"]);
    expect(result.options.v).toBe(true);
    expect(result.options.f).toBe(true);
  });

  it("should parse = syntax", () => {
    const result = parseArgv(["cmd", "--name=test"]);
    expect(result.options.name).toBe("test");
  });

  it("should handle no command", () => {
    const result = parseArgv(["--version"]);
    expect(result.commandName).toBeNull();
    expect(result.options.version).toBe(true);
  });

  it("should handle -- separator", () => {
    const result = parseArgv(["cmd", "--", "--not-an-option", "value"]);
    expect(result.commandName).toBe("cmd");
    expect(result.args["0"]).toBe("--not-an-option");
    expect(result.args["1"]).toBe("value");
  });

  it("should handle positional args after command", () => {
    const result = parseArgv(["make:entity", "User", "--timestamps"]);
    expect(result.commandName).toBe("make:entity");
    expect(result.args["0"]).toBe("User");
    expect(result.options.timestamps).toBe(true);
  });

  it("should handle empty argv", () => {
    const result = parseArgv([]);
    expect(result.commandName).toBeNull();
    expect(result.args).toEqual({});
    expect(result.options).toEqual({});
  });

  it("should handle multiple options", () => {
    const result = parseArgv(["migration:run", "--to", "M1", "--force", "--connection", "main"]);
    expect(result.commandName).toBe("migration:run");
    expect(result.options.to).toBe("M1");
    expect(result.options.force).toBe(true);
    expect(result.options.connection).toBe("main");
  });
});
