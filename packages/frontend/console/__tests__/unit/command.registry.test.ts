/**
 * @file command.registry.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the CommandRegistry.
 */

import { describe, it, expect, beforeEach } from "vitest";

import type { IRegisteredCommand } from "@/interfaces";

import { DuplicateCommandError } from "@/errors";
import { CommandRegistry } from "@/registries";

describe("CommandRegistry", () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  function createEntry(overrides: Partial<IRegisteredCommand> = {}): IRegisteredCommand {
    return {
      name: "test:command",
      description: "A test command",
      namespace: "test",
      arguments: [],
      options: [],
      classRef: class TestCommand {},
      subcommands: [],
      ...overrides,
    };
  }

  describe("register()", () => {
    it("should register a command entry", () => {
      const entry = createEntry();
      registry.register(entry);

      expect(registry.has("test:command")).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it("should throw DuplicateCommandError on name collision", () => {
      class FirstCommand {}
      class SecondCommand {}

      registry.register(createEntry({ classRef: FirstCommand }));

      expect(() => {
        registry.register(createEntry({ classRef: SecondCommand }));
      }).toThrow(DuplicateCommandError);
    });

    it("should associate subcommands with parent", () => {
      registry.register(createEntry({ name: "queue", namespace: "", subcommands: [] }));
      registry.register(createEntry({ name: "queue:work", namespace: "queue", parent: "queue" }));

      const parent = registry.get("queue");
      expect(parent?.subcommands).toContain("queue:work");
    });
  });

  describe("get()", () => {
    it("should return the command by name", () => {
      const entry = createEntry();
      registry.register(entry);

      const result = registry.get("test:command");
      expect(result).toEqual(entry);
    });

    it("should return undefined for non-existent name", () => {
      expect(registry.get("does:not:exist")).toBeUndefined();
    });
  });

  describe("has()", () => {
    it("should return true for registered commands", () => {
      registry.register(createEntry());
      expect(registry.has("test:command")).toBe(true);
    });

    it("should return false for unregistered commands", () => {
      expect(registry.has("unknown")).toBe(false);
    });
  });

  describe("getAll()", () => {
    it("should return all registered commands", () => {
      registry.register(createEntry({ name: "a:cmd", namespace: "a" }));
      registry.register(createEntry({ name: "b:cmd", namespace: "b" }));
      registry.register(createEntry({ name: "c:cmd", namespace: "c" }));

      expect(registry.getAll()).toHaveLength(3);
    });

    it("should return empty array when no commands registered", () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe("getByNamespace()", () => {
    it("should filter commands by namespace", () => {
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));
      registry.register(createEntry({ name: "config:cache", namespace: "config" }));
      registry.register(createEntry({ name: "queue:work", namespace: "queue" }));

      const configCmds = registry.getByNamespace("config");
      expect(configCmds).toHaveLength(2);
      expect(configCmds.every((c) => c.namespace === "config")).toBe(true);
    });

    it("should return empty array for non-existent namespace", () => {
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));
      expect(registry.getByNamespace("cache")).toEqual([]);
    });

    it("should return top-level commands with empty namespace", () => {
      registry.register(createEntry({ name: "list", namespace: "" }));
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));

      const topLevel = registry.getByNamespace("");
      expect(topLevel).toHaveLength(1);
      expect(topLevel[0]?.name).toBe("list");
    });
  });

  describe("getNamespaces()", () => {
    it("should return all unique non-empty namespaces sorted", () => {
      registry.register(createEntry({ name: "queue:work", namespace: "queue" }));
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));
      registry.register(createEntry({ name: "config:cache", namespace: "config" }));
      registry.register(createEntry({ name: "cache:clear", namespace: "cache" }));

      expect(registry.getNamespaces()).toEqual(["cache", "config", "queue"]);
    });

    it("should exclude empty namespace from results", () => {
      registry.register(createEntry({ name: "list", namespace: "" }));
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));

      expect(registry.getNamespaces()).toEqual(["config"]);
    });
  });

  describe("getNames()", () => {
    it("should return all command names", () => {
      registry.register(createEntry({ name: "list", namespace: "" }));
      registry.register(createEntry({ name: "config:publish", namespace: "config" }));

      expect(registry.getNames()).toContain("list");
      expect(registry.getNames()).toContain("config:publish");
    });
  });

  describe("extractNamespace()", () => {
    it("should extract namespace before first colon", () => {
      expect(CommandRegistry.extractNamespace("config:publish")).toBe("config");
      expect(CommandRegistry.extractNamespace("db:seed:fresh")).toBe("db");
    });

    it("should return empty string for names without colon", () => {
      expect(CommandRegistry.extractNamespace("list")).toBe("");
      expect(CommandRegistry.extractNamespace("help")).toBe("");
    });
  });
});
