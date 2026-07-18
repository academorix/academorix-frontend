/**
 * @file command.decorator.test.ts
 * @module @stackra/console/tests
 * @description Unit tests for the @Command() decorator.
 */

import "reflect-metadata";
import { describe, it, expect } from "vitest";
import { getMetadata } from "@vivtel/metadata";
import { Command } from "@/decorators";
import { COMMAND_METADATA_KEY } from "@/constants";
import { InvalidCommandNameError } from "@/errors";
import type { ICommandMetadata } from "@/interfaces";

describe("@Command() decorator", () => {
  it("should store metadata on the decorated class", () => {
    const metadata: ICommandMetadata = {
      name: "cache:clear",
      description: "Clear the application cache",
    };

    @Command(metadata)
    class CacheClearCommand {}

    const stored = getMetadata<ICommandMetadata>(COMMAND_METADATA_KEY, CacheClearCommand);
    expect(stored).toEqual(metadata);
  });

  it("should store arguments and options in metadata", () => {
    const metadata: ICommandMetadata = {
      name: "config:publish",
      description: "Publish config files",
      arguments: [{ name: "package", description: "Package name", required: true }],
      options: [
        {
          name: "--force",
          short: "-f",
          description: "Force overwrite",
          type: "boolean",
          default: false,
        },
      ],
    };

    @Command(metadata)
    class ConfigPublishCommand {}

    const stored = getMetadata<ICommandMetadata>(COMMAND_METADATA_KEY, ConfigPublishCommand);
    expect(stored?.arguments).toHaveLength(1);
    expect(stored?.arguments?.[0]?.name).toBe("package");
    expect(stored?.options).toHaveLength(1);
    expect(stored?.options?.[0]?.name).toBe("--force");
  });

  it("should store parent for subcommands", () => {
    const metadata: ICommandMetadata = {
      name: "queue:retry",
      description: "Retry failed jobs",
      parent: "queue",
    };

    @Command(metadata)
    class QueueRetryCommand {}

    const stored = getMetadata<ICommandMetadata>(COMMAND_METADATA_KEY, QueueRetryCommand);
    expect(stored?.parent).toBe("queue");
  });

  it("should accept valid command names", () => {
    expect(() => {
      @Command({ name: "list", description: "List commands" })
      class ListCmd {}
    }).not.toThrow();

    expect(() => {
      @Command({ name: "config:publish", description: "Publish config" })
      class ConfigPubCmd {}
    }).not.toThrow();

    expect(() => {
      @Command({ name: "make:command", description: "Make a command" })
      class MakeCmd {}
    }).not.toThrow();

    expect(() => {
      @Command({ name: "db:seed:fresh", description: "Fresh seed" })
      class DbSeedCmd {}
    }).not.toThrow();

    expect(() => {
      @Command({ name: "queue:work-failed", description: "Work failed" })
      class QueueWF {}
    }).not.toThrow();
  });

  it("should reject command names with uppercase", () => {
    expect(() => {
      @Command({ name: "Config:Publish", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });

  it("should reject command names with underscores", () => {
    expect(() => {
      @Command({ name: "cache_clear", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });

  it("should reject command names starting with a number", () => {
    expect(() => {
      @Command({ name: "1cache", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });

  it("should reject command names with trailing colon", () => {
    expect(() => {
      @Command({ name: "config:", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });

  it("should reject command names with spaces", () => {
    expect(() => {
      @Command({ name: "config publish", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });

  it("should reject empty command names", () => {
    expect(() => {
      @Command({ name: "", description: "test" })
      class Bad {}
    }).toThrow(InvalidCommandNameError);
  });
});
