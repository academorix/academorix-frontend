/**
 * @file pii-redactor.service.ts
 * @module @stackra/ai/core/services
 * @description Redacts personally-identifiable information from context
 *   frames before they leave the client. Applies configured field-path
 *   rules ("user.email" → "[REDACTED]") and value-pattern rules
 *   (regex-driven string replacement).
 *
 *   Requirement traceability:
 *
 *   - 12.4 — every context frame passes through the redactor before it is
 *            included in a UI context snapshot.
 *   - 12.6 — `redact(redact(x)) === redact(x)` (idempotence; Property 7).
 *   - 23.7 — PII redaction on every context sync path.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { Logger } from "@stackra/logger";
import { AI_CONFIG, type IAiConfig, type IAiContextFrame, type IPiiRule } from "@stackra/contracts";

const DEFAULT_REPLACEMENT = "[REDACTED]";

/**
 * A compiled redaction rule — either a field-path rule or a regex-pattern
 * rule.
 */
interface ICompiledRule {
  kind: "field" | "pattern";
  path?: string[];
  pattern?: RegExp;
  replacement: string;
}

/**
 * Cross-platform PII redactor.
 */
@Injectable()
export class PiiRedactor {
  private readonly logger = new Logger(PiiRedactor.name);

  /** Compiled rules — recomputed only if configuration changes. */
  private readonly compiled: ICompiledRule[];

  public constructor(@Optional() @Inject(AI_CONFIG) config?: IAiConfig) {
    this.compiled = (config?.context?.piiRules ?? []).map((rule) => this.compile(rule));
  }

  /**
   * Redact a single context frame. Returns a new frame with a deep-cloned
   * snapshot — the original frame is never mutated (Req 12.6 idempotence
   * hinges on `redact(x)` and `redact(redact(x))` producing structurally
   * identical outputs).
   */
  public redact<T extends IAiContextFrame>(frame: T): T {
    const cloned: T = {
      ...frame,
      snapshot: this.clone(frame.snapshot),
    };
    for (const rule of this.compiled) {
      cloned.snapshot = this.applyRule(cloned.snapshot, rule);
    }
    return cloned;
  }

  /** Redact every frame in an array. */
  public redactAll<T extends IAiContextFrame>(frames: readonly T[]): T[] {
    return frames.map((f) => this.redact(f));
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /** Compile an authored rule into an executable form. */
  private compile(rule: IPiiRule): ICompiledRule {
    const replacement = rule.replacement ?? DEFAULT_REPLACEMENT;
    if (rule.field) {
      return { kind: "field", path: rule.field.split("."), replacement };
    }
    if (rule.pattern) {
      try {
        return { kind: "pattern", pattern: new RegExp(rule.pattern, "g"), replacement };
      } catch (err) {
        this.logger.warn("[PiiRedactor] invalid regex pattern; rule ignored", {
          pattern: rule.pattern,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    // Fallback: a rule with neither `field` nor `pattern` matches nothing.
    return { kind: "field", path: [], replacement };
  }

  /**
   * Apply a compiled rule to a value.
   *
   * - `field` rule: walks the path; if the terminal key exists, sets it
   *   to the replacement (idempotent — setting the same value twice is
   *   the same as once).
   * - `pattern` rule: walks all string values in the value tree and
   *   replaces matches. Idempotence requires that the replacement does
   *   not itself match the pattern — that's the caller's responsibility
   *   (the default `[REDACTED]` is safe for common PII patterns).
   */
  private applyRule(value: unknown, rule: ICompiledRule): unknown {
    if (rule.kind === "field") {
      if (!rule.path || rule.path.length === 0) return value;
      return this.applyFieldRule(value, rule.path, rule.replacement);
    }
    if (rule.pattern) {
      return this.applyPatternRule(value, rule.pattern, rule.replacement);
    }
    return value;
  }

  private applyFieldRule(value: unknown, path: string[], replacement: string): unknown {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
    const [head, ...tail] = path;
    if (head === undefined) return value;
    const record = value as Record<string, unknown>;
    if (!(head in record)) return value;
    if (tail.length === 0) {
      record[head] = replacement;
      return record;
    }
    record[head] = this.applyFieldRule(record[head], tail, replacement);
    return record;
  }

  private applyPatternRule(value: unknown, pattern: RegExp, replacement: string): unknown {
    if (typeof value === "string") {
      // Reset the regex's lastIndex — a `/g` regex is stateful.
      pattern.lastIndex = 0;
      return value.replace(pattern, replacement);
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.applyPatternRule(item, pattern, replacement));
    }
    if (value !== null && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        record[key] = this.applyPatternRule(record[key], pattern, replacement);
      }
      return record;
    }
    return value;
  }

  /** Deep-clone a JSON-serializable value. */
  private clone(value: unknown): unknown {
    if (value === null || typeof value !== "object") return value;
    // `structuredClone` is available in Node 22 + all modern browsers.
    if (typeof globalThis.structuredClone === "function") {
      try {
        return globalThis.structuredClone(value);
      } catch {
        // Fall through to JSON clone.
      }
    }
    return JSON.parse(JSON.stringify(value));
  }
}
