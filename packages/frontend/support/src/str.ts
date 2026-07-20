/**
 * @file str.ts
 * @module @stackra/support
 * @description Static string manipulation class.
 *   Provides a comprehensive set of string helpers for case conversion,
 *   searching, trimming, padding, slugification, and more.
 *   All methods are static — no instantiation required.
 *
 *   This is the canonical string utility for the entire @stackra monorepo.
 *   Per coding standards, all string operations MUST go through this class
 *   rather than using native string methods directly in application code.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Cache
// ════════════════════════════════════════════════════════════════════════════════

/** Internal cache for studly conversions to avoid repeated computation. */
export const studlyCache: Map<string, string> = new Map();

/** Internal cache for snake conversions. */
export const snakeCache: Map<string, string> = new Map();

/** Internal cache for camel conversions. */
export const camelCache: Map<string, string> = new Map();

// ════════════════════════════════════════════════════════════════════════════════
// Irregular plurals
// ════════════════════════════════════════════════════════════════════════════════

/** Common irregular plural mappings (singular → plural). */
export const IRREGULAR_PLURALS: ReadonlyMap<string, string> = new Map([
  ["child", "children"],
  ["person", "people"],
  ["man", "men"],
  ["woman", "women"],
  ["mouse", "mice"],
  ["goose", "geese"],
  ["tooth", "teeth"],
  ["foot", "feet"],
  ["ox", "oxen"],
  ["leaf", "leaves"],
  ["life", "lives"],
  ["knife", "knives"],
  ["wife", "wives"],
  ["half", "halves"],
  ["self", "selves"],
  ["elf", "elves"],
  ["loaf", "loaves"],
  ["potato", "potatoes"],
  ["tomato", "tomatoes"],
  ["cactus", "cacti"],
  ["focus", "foci"],
  ["fungus", "fungi"],
  ["nucleus", "nuclei"],
  ["syllabus", "syllabi"],
  ["analysis", "analyses"],
  ["diagnosis", "diagnoses"],
  ["thesis", "theses"],
  ["crisis", "crises"],
  ["phenomenon", "phenomena"],
  ["criterion", "criteria"],
  ["datum", "data"],
]);

/** Reverse map for singularization (plural → singular). */
export const IRREGULAR_SINGULARS: ReadonlyMap<string, string> = new Map(
  Array.from(IRREGULAR_PLURALS.entries()).map(([s, p]) => [p, s]),
);

// ════════════════════════════════════════════════════════════════════════════════
// Str Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Static string manipulation utility class.
 *
 * Provides a fluent, consistent API for all string operations needed
 * across the @stackra ecosystem. Methods are pure functions that never
 * mutate the input string.
 *
 * @example
 * ```typescript
 * import { Str } from '@stackra/support';
 *
 * Str.studly('hello-world');    // 'HelloWorld'
 * Str.camel('hello-world');     // 'helloWorld'
 * Str.snake('helloWorld');      // 'hello_world'
 * Str.slug('Hello World!');     // 'hello-world'
 * Str.contains('foobar', 'ob'); // true
 * ```
 */
export class Str {
  // ══════════════════════════════════════════════════════════════════════════
  // Case Conversion
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Convert a string to StudlyCase (PascalCase).
   *
   * Splits on hyphens, underscores, spaces, and camelCase boundaries,
   * then capitalizes each word segment.
   *
   * @param value - The input string to convert
   * @returns The StudlyCase version of the string
   *
   * @example
   * ```typescript
   * Str.studly('hello-world');   // 'HelloWorld'
   * Str.studly('foo_bar_baz');   // 'FooBarBaz'
   * Str.studly('already Good'); // 'AlreadyGood'
   * ```
   */
  public static studly(value: string): string {
    const cached = studlyCache.get(value);
    if (cached !== undefined) return cached;

    const result = value
      .replace(/[-_\s]+(.)?/g, (_match, char: string | undefined) =>
        char ? char.toUpperCase() : "",
      )
      .replace(/^(.)/, (char) => char.toUpperCase());

    studlyCache.set(value, result);
    return result;
  }

  /**
   * Convert a string to camelCase.
   *
   * Like StudlyCase but with a lowercase first character.
   *
   * @param value - The input string to convert
   * @returns The camelCase version of the string
   *
   * @example
   * ```typescript
   * Str.camel('hello-world');  // 'helloWorld'
   * Str.camel('foo_bar');      // 'fooBar'
   * Str.camel('FooBar');       // 'fooBar'
   * ```
   */
  public static camel(value: string): string {
    const cached = camelCache.get(value);
    if (cached !== undefined) return cached;

    const studly = Str.studly(value);
    const result = studly.charAt(0).toLowerCase() + studly.slice(1);

    camelCache.set(value, result);
    return result;
  }

  /**
   * Convert a string to snake_case.
   *
   * Inserts underscores before uppercase letters and between word boundaries,
   * then lowercases the entire result.
   *
   * @param value - The input string to convert
   * @returns The snake_case version of the string
   *
   * @example
   * ```typescript
   * Str.snake('helloWorld');  // 'hello_world'
   * Str.snake('FooBar');     // 'foo_bar'
   * Str.snake('hello-world'); // 'hello_world'
   * ```
   */
  public static snake(value: string): string {
    const cached = snakeCache.get(value);
    if (cached !== undefined) return cached;

    const result = value
      .replace(/([A-Z])/g, " $1")
      .replace(/[-\s]+/g, "_")
      .replace(/^_/, "")
      .replace(/_+/g, "_")
      .toLowerCase();

    snakeCache.set(value, result);
    return result;
  }

  /**
   * Convert a string to kebab-case.
   *
   * Similar to snake_case but uses hyphens instead of underscores.
   *
   * @param value - The input string to convert
   * @returns The kebab-case version of the string
   *
   * @example
   * ```typescript
   * Str.kebab('helloWorld');  // 'hello-world'
   * Str.kebab('FooBar');     // 'foo-bar'
   * Str.kebab('foo_bar');    // 'foo-bar'
   * ```
   */
  public static kebab(value: string): string {
    return Str.snake(value).replace(/_/g, "-");
  }

  /**
   * Convert an entire string to lowercase.
   *
   * @param value - The input string
   * @returns The lowercased string
   *
   * @example
   * ```typescript
   * Str.lower('HELLO'); // 'hello'
   * ```
   */
  public static lower(value: string): string {
    return value.toLowerCase();
  }

  /**
   * Convert an entire string to uppercase.
   *
   * @param value - The input string
   * @returns The uppercased string
   *
   * @example
   * ```typescript
   * Str.upper('hello'); // 'HELLO'
   * ```
   */
  public static upper(value: string): string {
    return value.toUpperCase();
  }

  /**
   * Capitalize the first character of a string.
   *
   * @param value - The input string
   * @returns The string with its first character uppercased
   *
   * @example
   * ```typescript
   * Str.ucfirst('hello'); // 'Hello'
   * ```
   */
  public static ucfirst(value: string): string {
    if (value.length === 0) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  /**
   * Lowercase the first character of a string.
   *
   * @param value - The input string
   * @returns The string with its first character lowercased
   *
   * @example
   * ```typescript
   * Str.lcfirst('Hello'); // 'hello'
   * ```
   */
  public static lcfirst(value: string): string {
    if (value.length === 0) return value;
    return value.charAt(0).toLowerCase() + value.slice(1);
  }

  /**
   * Convert a string to Title Case (capitalize first letter of each word).
   *
   * @param value - The input string
   * @returns The title-cased string
   *
   * @example
   * ```typescript
   * Str.title('hello world'); // 'Hello World'
   * Str.title('foo-bar baz'); // 'Foo-Bar Baz'
   * ```
   */
  public static title(value: string): string {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Convert a string to a human-readable headline format.
   *
   * Splits on camelCase, snake_case, and kebab-case boundaries,
   * then capitalizes each word.
   *
   * @param value - The input string
   * @returns The headline version of the string
   *
   * @example
   * ```typescript
   * Str.headline('helloWorld');       // 'Hello World'
   * Str.headline('foo_bar_baz');     // 'Foo Bar Baz'
   * Str.headline('hello-world-foo'); // 'Hello World Foo'
   * ```
   */
  public static headline(value: string): string {
    const words = value
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]+/g, " ")
      .trim()
      .split(/\s+/);

    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Search & Match
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Determine if a string contains a given substring.
   *
   * @param value - The string to search within
   * @param search - The substring to search for
   * @returns True if the substring is found
   *
   * @example
   * ```typescript
   * Str.contains('hello world', 'world'); // true
   * Str.contains('hello', 'xyz');         // false
   * ```
   */
  public static contains(value: string, search: string): boolean {
    return value.includes(search);
  }

  /**
   * Determine if a string starts with a given prefix.
   *
   * @param value - The string to check
   * @param prefix - The prefix to look for
   * @returns True if the string starts with the prefix
   *
   * @example
   * ```typescript
   * Str.startsWith('hello world', 'hello'); // true
   * ```
   */
  public static startsWith(value: string, prefix: string): boolean {
    return value.startsWith(prefix);
  }

  /**
   * Determine if a string ends with a given suffix.
   *
   * @param value - The string to check
   * @param suffix - The suffix to look for
   * @returns True if the string ends with the suffix
   *
   * @example
   * ```typescript
   * Str.endsWith('hello world', 'world'); // true
   * ```
   */
  public static endsWith(value: string, suffix: string): boolean {
    return value.endsWith(suffix);
  }

  /**
   * Determine if a string matches a given pattern (supports * wildcards).
   *
   * The pattern uses `*` as a wildcard that matches any sequence of characters.
   *
   * @param value - The string to test
   * @param pattern - The pattern with optional `*` wildcards
   * @returns True if the string matches the pattern
   *
   * @example
   * ```typescript
   * Str.is('foo/bar/baz', 'foo/*');       // true
   * Str.is('foo/bar/baz', 'foo//baz');   // true
   * Str.is('hello', 'h*o');              // true
   * Str.is('hello', 'world');            // false
   * ```
   */
  public static is(value: string, pattern: string): boolean {
    if (pattern === value) return true;
    if (pattern === "*") return true;

    // Escape regex special chars except *, then convert * to .*
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");

    return new RegExp(`^${escaped}$`).test(value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Trimming
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Trim whitespace from both ends of a string.
   *
   * @param value - The input string
   * @returns The trimmed string
   *
   * @example
   * ```typescript
   * Str.trim('  hello  '); // 'hello'
   * ```
   */
  public static trim(value: string): string {
    return value.trim();
  }

  /**
   * Trim whitespace from the left side of a string.
   *
   * @param value - The input string
   * @returns The left-trimmed string
   *
   * @example
   * ```typescript
   * Str.ltrim('  hello'); // 'hello'
   * ```
   */
  public static ltrim(value: string): string {
    return value.trimStart();
  }

  /**
   * Trim whitespace from the right side of a string.
   *
   * @param value - The input string
   * @returns The right-trimmed string
   *
   * @example
   * ```typescript
   * Str.rtrim('hello  '); // 'hello'
   * ```
   */
  public static rtrim(value: string): string {
    return value.trimEnd();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Limiting & Padding
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Truncate a string to a given length, appending an ending if truncated.
   *
   * @param value - The input string
   * @param length - Maximum length (including the ending)
   * @param end - The ending to append when truncated (default: '...')
   * @returns The truncated string
   *
   * @example
   * ```typescript
   * Str.limit('Hello World', 5);          // 'He...'
   * Str.limit('Hello World', 5, '---');   // 'He---'
   * Str.limit('Hi', 10);                  // 'Hi'
   * ```
   */
  public static limit(value: string, length: number, end: string = "..."): string {
    if (value.length <= length) return value;
    return value.slice(0, length - end.length) + end;
  }

  /**
   * Truncate a string by word count, appending an ending if truncated.
   *
   * @param value - The input string
   * @param wordCount - Maximum number of words
   * @param end - The ending to append when truncated (default: '...')
   * @returns The string truncated to the word limit
   *
   * @example
   * ```typescript
   * Str.words('The quick brown fox', 2);       // 'The quick...'
   * Str.words('The quick brown fox', 2, '…');  // 'The quick…'
   * Str.words('Hello', 5);                     // 'Hello'
   * ```
   */
  public static words(value: string, wordCount: number, end: string = "..."): string {
    const allWords = value.split(/\s+/).filter(Boolean);
    if (allWords.length <= wordCount) return value;
    return allWords.slice(0, wordCount).join(" ") + end;
  }

  /**
   * Pad a string on the left to a given length.
   *
   * @param value - The input string
   * @param length - The desired total length
   * @param pad - The character to pad with (default: ' ')
   * @returns The left-padded string
   *
   * @example
   * ```typescript
   * Str.padLeft('42', 5, '0'); // '00042'
   * Str.padLeft('hi', 5);     // '   hi'
   * ```
   */
  public static padLeft(value: string, length: number, pad: string = " "): string {
    return value.padStart(length, pad);
  }

  /**
   * Pad a string on the right to a given length.
   *
   * @param value - The input string
   * @param length - The desired total length
   * @param pad - The character to pad with (default: ' ')
   * @returns The right-padded string
   *
   * @example
   * ```typescript
   * Str.padRight('hi', 5, '.'); // 'hi...'
   * Str.padRight('hi', 5);     // 'hi   '
   * ```
   */
  public static padRight(value: string, length: number, pad: string = " "): string {
    return value.padEnd(length, pad);
  }

  /**
   * Repeat a string a given number of times.
   *
   * @param value - The string to repeat
   * @param times - Number of repetitions
   * @returns The repeated string
   *
   * @example
   * ```typescript
   * Str.repeat('ha', 3); // 'hahaha'
   * ```
   */
  public static repeat(value: string, times: number): string {
    return value.repeat(times);
  }

  /**
   * Take the first n characters from a string.
   *
   * @param value - The input string
   * @param length - Number of characters to take
   * @returns The first n characters
   *
   * @example
   * ```typescript
   * Str.take('Hello World', 5); // 'Hello'
   * ```
   */
  public static take(value: string, length: number): string {
    return value.slice(0, length);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Replacement
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Replace all occurrences of a search string with a replacement.
   *
   * @param value - The input string
   * @param search - The substring to find
   * @param replacement - The replacement string
   * @returns The string with all occurrences replaced
   *
   * @example
   * ```typescript
   * Str.replace('foo bar foo', 'foo', 'baz'); // 'baz bar baz'
   * ```
   */
  public static replace(value: string, search: string, replacement: string): string {
    return value.split(search).join(replacement);
  }

  /**
   * Replace the first occurrence of a search string with a replacement.
   *
   * @param value - The input string
   * @param search - The substring to find
   * @param replacement - The replacement string
   * @returns The string with the first occurrence replaced
   *
   * @example
   * ```typescript
   * Str.replaceFirst('foo bar foo', 'foo', 'baz'); // 'baz bar foo'
   * ```
   */
  public static replaceFirst(value: string, search: string, replacement: string): string {
    const index = value.indexOf(search);
    if (index === -1) return value;
    return value.slice(0, index) + replacement + value.slice(index + search.length);
  }

  /**
   * Replace the last occurrence of a search string with a replacement.
   *
   * @param value - The input string
   * @param search - The substring to find
   * @param replacement - The replacement string
   * @returns The string with the last occurrence replaced
   *
   * @example
   * ```typescript
   * Str.replaceLast('foo bar foo', 'foo', 'baz'); // 'foo bar baz'
   * ```
   */
  public static replaceLast(value: string, search: string, replacement: string): string {
    const index = value.lastIndexOf(search);
    if (index === -1) return value;
    return value.slice(0, index) + replacement + value.slice(index + search.length);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Extraction
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the portion of a string after the first occurrence of a search value.
   *
   * @param value - The input string
   * @param search - The delimiter to search for
   * @returns The portion after the first occurrence, or the full string if not found
   *
   * @example
   * ```typescript
   * Str.after('hello::world', '::'); // 'world'
   * Str.after('hello', '::');        // 'hello'
   * ```
   */
  public static after(value: string, search: string): string {
    const index = value.indexOf(search);
    if (index === -1) return value;
    return value.slice(index + search.length);
  }

  /**
   * Get the portion of a string after the last occurrence of a search value.
   *
   * @param value - The input string
   * @param search - The delimiter to search for
   * @returns The portion after the last occurrence, or the full string if not found
   *
   * @example
   * ```typescript
   * Str.afterLast('app/http/controllers', '/'); // 'controllers'
   * ```
   */
  public static afterLast(value: string, search: string): string {
    const index = value.lastIndexOf(search);
    if (index === -1) return value;
    return value.slice(index + search.length);
  }

  /**
   * Get the portion of a string before the first occurrence of a search value.
   *
   * @param value - The input string
   * @param search - The delimiter to search for
   * @returns The portion before the first occurrence, or the full string if not found
   *
   * @example
   * ```typescript
   * Str.before('hello::world', '::'); // 'hello'
   * ```
   */
  public static before(value: string, search: string): string {
    const index = value.indexOf(search);
    if (index === -1) return value;
    return value.slice(0, index);
  }

  /**
   * Get the portion of a string before the last occurrence of a search value.
   *
   * @param value - The input string
   * @param search - The delimiter to search for
   * @returns The portion before the last occurrence, or the full string if not found
   *
   * @example
   * ```typescript
   * Str.beforeLast('app/http/controllers', '/'); // 'app/http'
   * ```
   */
  public static beforeLast(value: string, search: string): string {
    const index = value.lastIndexOf(search);
    if (index === -1) return value;
    return value.slice(0, index);
  }

  /**
   * Get the portion of a string between two delimiters.
   *
   * @param value - The input string
   * @param start - The start delimiter
   * @param end - The end delimiter
   * @returns The portion between the two delimiters
   *
   * @example
   * ```typescript
   * Str.between('[hello]', '[', ']');   // 'hello'
   * Str.between('foo {bar} baz', '{', '}'); // 'bar'
   * ```
   */
  public static between(value: string, start: string, end: string): string {
    const afterStart = Str.after(value, start);
    return Str.before(afterStart, end);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Slug & URL
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a URL-friendly slug from a string.
   *
   * Converts to lowercase, replaces non-alphanumeric characters with the
   * separator, and removes leading/trailing separators.
   *
   * @param value - The input string
   * @param separator - The separator character (default: '-')
   * @returns The slugified string
   *
   * @example
   * ```typescript
   * Str.slug('Hello World!');        // 'hello-world'
   * Str.slug('Hello World!', '_');   // 'hello_world'
   * Str.slug('  Foo & Bar  ');       // 'foo-bar'
   * ```
   */
  public static slug(value: string, separator: string = "-"): string {
    // Normalize to ASCII-friendly form
    const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return normalized
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, separator)
      .replace(new RegExp(`^\\${separator}+|\\${separator}+$`, "g"), "");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Random & ID Generation
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Generate a random alphanumeric string.
   *
   * Uses `crypto.getRandomValues` when available for secure randomness,
   * falls back to `Math.random` otherwise.
   *
   * @param length - The desired length (default: 16)
   * @returns A random string of the given length
   *
   * @example
   * ```typescript
   * Str.random();   // e.g., 'a4b2c8d1e9f3g7h0'
   * Str.random(8);  // e.g., 'x7k2m9p4'
   * ```
   */
  public static random(length: number = 16): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charsLength = chars.length;

    // Use crypto if available for better randomness
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
      const array = new Uint32Array(length);
      globalThis.crypto.getRandomValues(array);
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars[array[i]! % charsLength];
      }
      return result;
    }

    // Fallback to Math.random
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * charsLength)];
    }
    return result;
  }

  /**
   * Generate a UUID v4 string.
   *
   * Uses `crypto.randomUUID` when available, otherwise falls back to a
   * manual implementation using `crypto.getRandomValues`.
   *
   * @returns A new UUID v4 string
   *
   * @example
   * ```typescript
   * Str.uuid(); // e.g., '550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  public static uuid(): string {
    // Use native randomUUID when available
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    // Fallback implementation
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 16; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // Set version 4 bits
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    // Set variant bits
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Affixing
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Ensure a string ends with a given suffix. Appends it only if missing.
   *
   * @param value - The input string
   * @param cap - The suffix to ensure
   * @returns The string guaranteed to end with the suffix
   *
   * @example
   * ```typescript
   * Str.finish('/path', '/');     // '/path/'
   * Str.finish('/path/', '/');    // '/path/'
   * ```
   */
  public static finish(value: string, cap: string): string {
    if (value.endsWith(cap)) return value;
    return value + cap;
  }

  /**
   * Ensure a string starts with a given prefix. Prepends it only if missing.
   *
   * @param value - The input string
   * @param cap - The prefix to ensure
   * @returns The string guaranteed to start with the prefix
   *
   * @example
   * ```typescript
   * Str.start('path', '/');     // '/path'
   * Str.start('/path', '/');   // '/path'
   * ```
   */
  public static start(value: string, cap: string): string {
    if (value.startsWith(cap)) return value;
    return cap + value;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Inspection
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Check if a string is empty (zero length or only whitespace).
   *
   * @param value - The input string
   * @returns True if the string is empty or whitespace-only
   *
   * @example
   * ```typescript
   * Str.isEmpty('');    // true
   * Str.isEmpty('  '); // true
   * Str.isEmpty('hi'); // false
   * ```
   */
  public static isEmpty(value: string): boolean {
    return value.trim().length === 0;
  }

  /**
   * Check if a string is not empty.
   *
   * @param value - The input string
   * @returns True if the string contains non-whitespace characters
   *
   * @example
   * ```typescript
   * Str.isNotEmpty('hello'); // true
   * Str.isNotEmpty('');      // false
   * ```
   */
  public static isNotEmpty(value: string): boolean {
    return !Str.isEmpty(value);
  }

  /**
   * Get the length of a string.
   *
   * @param value - The input string
   * @returns The string length
   *
   * @example
   * ```typescript
   * Str.len('hello'); // 5
   * ```
   */
  public static len(value: string): number {
    return value.length;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Pluralization
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the plural form of a word.
   *
   * Handles common English pluralization rules and irregular forms.
   * This is a best-effort implementation — not a full NLP library.
   *
   * @param value - The singular word
   * @returns The plural form
   *
   * @example
   * ```typescript
   * Str.plural('cat');    // 'cats'
   * Str.plural('child'); // 'children'
   * Str.plural('city');  // 'cities'
   * Str.plural('bus');   // 'buses'
   * ```
   */
  public static plural(value: string): string {
    if (value.length === 0) return value;

    const lower = value.toLowerCase();

    // Check irregular plurals first
    const irregular = IRREGULAR_PLURALS.get(lower);
    if (irregular) {
      // Preserve original casing of first char
      if (value[0] === value[0]!.toUpperCase()) {
        return irregular.charAt(0).toUpperCase() + irregular.slice(1);
      }
      return irregular;
    }

    // Uncountable words
    const uncountable = [
      "sheep",
      "fish",
      "deer",
      "species",
      "series",
      "money",
      "rice",
      "information",
      "equipment",
    ];
    if (uncountable.includes(lower)) return value;

    // Rule-based pluralization
    if (lower.endsWith("y") && !/[aeiou]y$/.test(lower)) {
      return value.slice(0, -1) + "ies";
    }
    if (
      lower.endsWith("s") ||
      lower.endsWith("sh") ||
      lower.endsWith("ch") ||
      lower.endsWith("x") ||
      lower.endsWith("z")
    ) {
      return value + "es";
    }
    if (lower.endsWith("f")) {
      return value.slice(0, -1) + "ves";
    }
    if (lower.endsWith("fe")) {
      return value.slice(0, -2) + "ves";
    }

    return value + "s";
  }

  /**
   * Get the singular form of a word.
   *
   * Handles common English singularization rules and irregular forms.
   * This is a best-effort implementation — not a full NLP library.
   *
   * @param value - The plural word
   * @returns The singular form
   *
   * @example
   * ```typescript
   * Str.singular('cats');     // 'cat'
   * Str.singular('children'); // 'child'
   * Str.singular('cities');   // 'city'
   * ```
   */
  public static singular(value: string): string {
    if (value.length === 0) return value;

    const lower = value.toLowerCase();

    // Check irregular singulars first
    const irregular = IRREGULAR_SINGULARS.get(lower);
    if (irregular) {
      if (value[0] === value[0]!.toUpperCase()) {
        return irregular.charAt(0).toUpperCase() + irregular.slice(1);
      }
      return irregular;
    }

    // Uncountable words
    const uncountable = [
      "sheep",
      "fish",
      "deer",
      "species",
      "series",
      "money",
      "rice",
      "information",
      "equipment",
    ];
    if (uncountable.includes(lower)) return value;

    // Rule-based singularization
    if (lower.endsWith("ies") && value.length > 4) {
      return value.slice(0, -3) + "y";
    }
    if (lower.endsWith("ves")) {
      return value.slice(0, -3) + "f";
    }
    if (
      lower.endsWith("ses") ||
      lower.endsWith("shes") ||
      lower.endsWith("ches") ||
      lower.endsWith("xes") ||
      lower.endsWith("zes")
    ) {
      return value.slice(0, -2);
    }
    if (lower.endsWith("s") && !lower.endsWith("ss")) {
      return value.slice(0, -1);
    }

    return value;
  }
}
