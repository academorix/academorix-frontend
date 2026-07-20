/**
 * @file command.registry.base.test.ts
 * @module @stackra/console/tests
 * @description Extended tests for `CommandRegistry` — specifically the
 *   parts of the {@link BaseRegistry} adoption story that the
 *   existing `command.registry.test.ts` doesn't yet cover.
 *
 *   Covers:
 *
 *     1. Method-overload symmetry — both `register(entry)` AND
 *        `register(key, value)` route through the SAME validation +
 *        lifecycle hook.
 *     2. `onRegister` hook fires exactly once per successful register
 *        (asserted via a spy on the protected override).
 *     3. `makeDuplicateError` override returns
 *        `DuplicateCommandError`, not the generic
 *        `RegistryDuplicateError`.
 *     4. Inherited base surface — `values()`, `keys()`, `entries()`,
 *        `count()`, `remove()`, `clear()` — behave correctly for the
 *        `IRegisteredCommand`-keyed registry.
 */

import { describe, expect, it, beforeEach, vi } from "vitest";

import { ConsoleError, DuplicateCommandError } from "@/errors";
import { CommandRegistry } from "@/registries";

import type { IRegisteredCommand } from "@/interfaces";

// ────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────

function createEntry(overrides: Partial<IRegisteredCommand> = {}): IRegisteredCommand {
  return {
    name: "test:command",
    description: "A test command.",
    namespace: "test",
    arguments: [],
    options: [],
    classRef: class TestCommand {},
    subcommands: [],
    ...overrides,
  };
}

/**
 * A subclass that spies on the protected `onRegister` hook — the
 * only way to reach a protected method without breaking the type
 * seal is to expose it via a subclass.
 */
class SpyCommandRegistry extends CommandRegistry {
  public readonly onRegisterSpy = vi.fn<[string, IRegisteredCommand], void>();

  protected override onRegister(key: string, value: IRegisteredCommand): void {
    super.onRegister(key, value);
    this.onRegisterSpy(key, value);
  }
}

// ────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────

describe("CommandRegistry — BaseRegistry adoption", () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  describe("method overload — register(entry) vs register(key, value)", () => {
    it("`register(entry)` (1-arg form) works", () => {
      const entry = createEntry({ name: "one-arg" });
      registry.register(entry);
      expect(registry.get("one-arg")).toBe(entry);
    });

    it("`register(key, value)` (2-arg form) works", () => {
      const entry = createEntry({ name: "two-arg" });
      registry.register("two-arg", entry);
      expect(registry.get("two-arg")).toBe(entry);
    });

    it("both overloads route through the same validation (rejects duplicates)", () => {
      const first = createEntry({ name: "dup-me" });
      registry.register(first);
      // Second attempt via the (key, value) form must still throw.
      expect(() =>
        registry.register("dup-me", createEntry({ name: "dup-me" })),
      ).toThrow(DuplicateCommandError);
    });

    it("returns `this` from both overloads for chaining", () => {
      const returned1 = registry.register(createEntry({ name: "cmd-a" }));
      expect(returned1).toBe(registry);
      const returned2 = registry.register("cmd-b", createEntry({ name: "cmd-b" }));
      expect(returned2).toBe(registry);
    });
  });

  describe("onRegister lifecycle hook", () => {
    let spy: SpyCommandRegistry;

    beforeEach(() => {
      spy = new SpyCommandRegistry();
    });

    it("fires exactly once per successful register", () => {
      spy.register(createEntry({ name: "aa:cmd", namespace: "aa" }));
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);
    });

    it("does NOT fire when register throws (duplicate)", () => {
      spy.register(createEntry({ name: "dup", namespace: "test" }));
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);

      // Duplicate — throws BEFORE onRegister runs.
      expect(() =>
        spy.register(createEntry({ name: "dup", namespace: "test" })),
      ).toThrow(DuplicateCommandError);
      // Still exactly 1 — the failed attempt didn't fire.
      expect(spy.onRegisterSpy).toHaveBeenCalledTimes(1);
    });

    it("receives the (key, entry) pair", () => {
      const entry = createEntry({ name: "aa:cmd", namespace: "aa" });
      spy.register(entry);
      expect(spy.onRegisterSpy).toHaveBeenCalledWith("aa:cmd", entry);
    });

    it("subcommand → parent linking runs through onRegister", () => {
      // Register the parent first, then a subcommand — the base
      // registry drives onRegister after Map insertion, so the
      // subclass hook uses the map that ALREADY contains the parent.
      spy.register(createEntry({ name: "queue", namespace: "" }));
      spy.register(
        createEntry({ name: "queue:work", namespace: "queue", parent: "queue" }),
      );
      // The parent's `subcommands` was mutated by onRegister.
      const parent = spy.get("queue");
      expect(parent?.subcommands).toContain("queue:work");
    });
  });

  describe("makeDuplicateError override", () => {
    it("throws `DuplicateCommandError` (not the generic `RegistryDuplicateError`)", () => {
      registry.register(createEntry({ name: "dup" }));
      // The exact class is DuplicateCommandError — the domain-
      // specific override.
      let caught: unknown = null;
      try {
        registry.register(createEntry({ name: "dup" }));
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(DuplicateCommandError);
      // Not the base class.
      expect((caught as Error).name).toBe("DuplicateCommandError");
    });

    it("`DuplicateCommandError` extends `ConsoleError` (family kinship for catch-all consumers)", () => {
      registry.register(createEntry({ name: "dup", classRef: class ExistingClass {} }));
      let caught: unknown = null;
      try {
        registry.register(createEntry({ name: "dup", classRef: class SecondClass {} }));
      } catch (err) {
        caught = err;
      }
      // The domain error inherits the workspace-wide `ConsoleError`
      // base — a top-level try/catch in the CLI kernel funnels it
      // into the same failure path as every other console error.
      expect(caught).toBeInstanceOf(ConsoleError);
    });

    it("names BOTH class refs in the duplicate error", () => {
      class FirstCommand {}
      class SecondCommand {}
      registry.register(createEntry({ name: "dup", classRef: FirstCommand }));
      let caught: DuplicateCommandError | null = null;
      try {
        registry.register(createEntry({ name: "dup", classRef: SecondCommand }));
      } catch (err) {
        caught = err as DuplicateCommandError;
      }
      expect(caught?.name).toBe("DuplicateCommandError");
      // Both source class names appear in the message.
      expect(caught?.message).toContain("FirstCommand");
      expect(caught?.message).toContain("SecondCommand");
    });
  });

  describe("inherited base surface", () => {
    beforeEach(() => {
      registry.register(createEntry({ name: "aa:cmd", namespace: "aa" }));
      registry.register(createEntry({ name: "bb:cmd", namespace: "bb" }));
      registry.register(createEntry({ name: "cc:cmd", namespace: "cc" }));
    });

    it("`values()` returns every entry in insertion order", () => {
      const names = registry.values().map((e) => e.name);
      expect(names).toEqual(["aa:cmd", "bb:cmd", "cc:cmd"]);
    });

    it("`keys()` returns every fully-qualified command name", () => {
      expect(registry.keys()).toEqual(["aa:cmd", "bb:cmd", "cc:cmd"]);
    });

    it("`entries()` returns [name, entry] tuples", () => {
      const entries = registry.entries();
      expect(entries.length).toBe(3);
      expect(entries[0]?.[0]).toBe("aa:cmd");
      expect(entries[0]?.[1].namespace).toBe("aa");
    });

    it("`count()` returns the total", () => {
      expect(registry.count()).toBe(3);
    });

    it("`remove(name)` deletes the entry + returns true", () => {
      expect(registry.remove("bb:cmd")).toBe(true);
      expect(registry.has("bb:cmd")).toBe(false);
      expect(registry.count()).toBe(2);
    });

    it("`remove(name)` returns false for a missing key", () => {
      expect(registry.remove("does-not-exist")).toBe(false);
      expect(registry.count()).toBe(3);
    });

    it("`clear()` empties the registry", () => {
      registry.clear();
      expect(registry.count()).toBe(0);
    });

    it("after clear, the same name can be re-registered without a duplicate error", () => {
      registry.clear();
      expect(() =>
        registry.register(createEntry({ name: "aa:cmd", namespace: "aa" })),
      ).not.toThrow();
      expect(registry.count()).toBe(1);
    });
  });
});
