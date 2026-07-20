/**
 * @file argv-parser.util.ts
 * @module @stackra/console/utils
 * @description Lightweight argv parser for CLI command dispatch.
 *   Parses process.argv into command name, positional args, and options.
 *   No external dependencies.
 */

import type { ParsedArgv } from "../interfaces/parsed-argv.interface";

// ============================================================================
// Parser
// ============================================================================

/**
 * Parse an argv array into structured command input.
 *
 * Supports:
 * - Command name as first positional: `migration:run`
 * - Long options with value: `--to Migration20250601`
 * - Long boolean flags: `--verbose`
 * - Short options with value: `-t Migration20250601`
 * - Short boolean flags: `-v`
 * - `--` separator (everything after is positional)
 * - `=` syntax: `--to=Migration20250601`
 *
 * @param argv - The argument array (typically process.argv.slice(2))
 * @returns Parsed command structure
 *
 * @example
 * ```typescript
 * parseArgv(['migration:run', '--to', 'Migration20250601', '--verbose'])
 * // → { commandName: 'migration:run', args: {}, options: { to: 'Migration20250601', verbose: true } }
 * ```
 */
export function parseArgv(argv: string[]): ParsedArgv {
  const result: ParsedArgv = {
    commandName: null,
    args: {},
    options: {},
  };

  let positionalIndex = 0;
  let i = 0;
  let passedSeparator = false;

  while (i < argv.length) {
    const arg = argv[i]!;

    // After `--` separator, everything is positional
    if (arg === "--") {
      passedSeparator = true;
      i++;
      continue;
    }

    if (passedSeparator) {
      result.args[String(positionalIndex)] = arg;
      positionalIndex++;
      i++;
      continue;
    }

    // Long option: --key=value or --key value or --flag
    if (arg.startsWith("--")) {
      const withoutPrefix = arg.slice(2);

      if (withoutPrefix.includes("=")) {
        const eqIndex = withoutPrefix.indexOf("=");
        const key = withoutPrefix.slice(0, eqIndex);
        const value = withoutPrefix.slice(eqIndex + 1);
        result.options[key] = value;
      } else {
        // Check if next arg is a value (not a flag)
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          result.options[withoutPrefix] = next;
          i++; // skip next
        } else {
          result.options[withoutPrefix] = true;
        }
      }
      i++;
      continue;
    }

    // Short option: -k value or -f (flag)
    if (arg.startsWith("-") && arg.length >= 2) {
      const key = arg.slice(1);

      // Single character short options
      if (key.length === 1) {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          result.options[key] = next;
          i++; // skip next
        } else {
          result.options[key] = true;
        }
      } else {
        // Multiple short flags combined: -vf → { v: true, f: true }
        for (const char of key) {
          result.options[char] = true;
        }
      }
      i++;
      continue;
    }

    // Positional argument
    if (result.commandName === null) {
      result.commandName = arg;
    } else {
      result.args[String(positionalIndex)] = arg;
      positionalIndex++;
    }
    i++;
  }

  return result;
}
