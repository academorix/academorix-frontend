/**
 * @file tool-converter.service.ts
 * @module @stackra/ai/core/services
 * @description Converts registered client-tool entries into JSON-schema
 *   {@link IAiClientToolDefinition} objects the backend can understand.
 *
 *   Two responsibilities:
 *
 *   1. **Synchronous conversion** — `currentDefinitions()` returns the
 *      current set for piggybacking on the next chat request (per design
 *      decision, this is the primary advertisement path).
 *   2. **Proactive advertisement** — subscribes to registry changes, and
 *      after a 500ms debounce window emits `AI_EVENTS.TOOLSET_CHANGED`
 *      (and notifies local listeners) *only* if the resulting set
 *      differs from the last emission. This is the "diff + debounce"
 *      described in Req 7.4 + 7.5 and validated by Property 5.
 *
 *   Requirement traceability:
 *   - 7.1 — convert each registered client tool to a JSON-schema tool
 *           definition.
 *   - 7.4 — debounce re-advertisement to at most one per 500ms window.
 *   - 7.5 — suppress re-advertisement when the set is unchanged.
 *   - 7.6 — preserve the tool name + parameter names (P4).
 *   - 7.7 — throw a descriptive error identifying the offending tool.
 */

import {
  Inject,
  Injectable,
  Optional,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@stackra/container';
import { Logger } from '@stackra/logger';
import {
  AI_EVENTS,
  AI_TOOL_REGISTRY,
  EVENT_EMITTER,
  type IAiClientToolDefinition,
  type IEventEmitter,
} from '@stackra/contracts';

import { AiSchemaError } from '../errors';
import { deepEqual } from '../utils/deep-equal.util';
import type { IToolEntry } from '../registries/tool.registry';
import { ToolRegistry } from '../registries/tool.registry';

/** Debounce window for proactive re-advertisement, in milliseconds. */
const DEBOUNCE_MS = 500;

/**
 * Duck-type check for a value that looks like a zod schema.
 *
 * Works for both zod v3 (`_def`) and v4 (`.def`) since we only rely on the
 * presence of `safeParse` — the runtime contract every zod schema exposes.
 */
function isZodLike(value: unknown): value is {
  safeParse: (v: unknown) => unknown;
  shape?: Record<string, unknown>;
  _def?: { typeName?: string };
  def?: { type?: string };
} {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { safeParse?: unknown }).safeParse === 'function'
  );
}

/** Duck-type: a zod schema whose top-level type is object. */
function isZodObject(schema: unknown): schema is {
  shape: Record<string, unknown>;
  safeParse: (v: unknown) => unknown;
} {
  if (!isZodLike(schema)) return false;
  const s = schema as { shape?: unknown; _def?: { typeName?: string }; def?: { type?: string } };
  if (typeof s.shape !== 'object' || s.shape === null) return false;
  const v3Name = s._def?.typeName;
  const v4Type = s.def?.type;
  return (
    v3Name === 'ZodObject' || v4Type === 'object' || (v3Name === undefined && v4Type === undefined)
  );
}

/** Detect a nested optional (zod v3 `ZodOptional` or v4 `optional` flag). */
function isZodOptional(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false;
  const s = schema as {
    _def?: { typeName?: string; innerType?: unknown };
    def?: { type?: string; innerType?: unknown };
    isOptional?: () => boolean;
  };
  if (s._def?.typeName === 'ZodOptional' || s._def?.typeName === 'ZodDefault') return true;
  if (s.def?.type === 'optional' || s.def?.type === 'default') return true;
  if (typeof s.isOptional === 'function' && s.isOptional()) return true;
  return false;
}

/** Best-effort primitive typeName extraction (zod v3 / v4). */
function primitiveType(schema: unknown): string {
  if (!schema || typeof schema !== 'object') return 'string';
  const s = schema as { _def?: { typeName?: string }; def?: { type?: string } };
  const name = s._def?.typeName ?? s.def?.type ?? '';
  const lower = name.replace(/^Zod/, '').toLowerCase();
  switch (lower) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'bigint':
      return 'number';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'string';
  }
}

/**
 * Minimal zod → JSON-schema converter.
 *
 * Deliberately narrow: preserves the name + parameter-name invariant that
 * Property 4 asserts, produces recognisable types for primitives/arrays/
 * objects, and passes non-zod inputs through unchanged (assumed to be
 * already-JSON-schema).
 */
function toJsonSchema(parameters: unknown): unknown {
  if (!isZodLike(parameters)) {
    // Not a zod schema — assume it's already a JSON schema or a plain
    // record and pass through.
    return parameters ?? {};
  }
  if (!isZodObject(parameters)) {
    // Zod-like but not an object at the top — express it as a primitive.
    return { type: primitiveType(parameters) };
  }
  const shape = (parameters as { shape: Record<string, unknown> }).shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, field] of Object.entries(shape)) {
    properties[key] = fieldSchema(field);
    if (!isZodOptional(field)) required.push(key);
  }
  const output: Record<string, unknown> = { type: 'object', properties };
  if (required.length > 0) output.required = required;
  return output;
}

/** Convert a single zod field to a minimal JSON-schema shape. */
function fieldSchema(field: unknown): unknown {
  if (!isZodLike(field)) return { type: 'string' };
  if (isZodObject(field)) return toJsonSchema(field);
  // Peel one level of Optional/Default off so `.string().optional()`
  // reports `type: string` rather than `type: optional`.
  const inner =
    (field as { _def?: { innerType?: unknown } })._def?.innerType ??
    (field as { def?: { innerType?: unknown } }).def?.innerType;
  if (inner) return fieldSchema(inner);
  return { type: primitiveType(field) };
}

/** Change listener signature emitted by {@link ToolConverter.onChange}. */
export type ToolsetListener = (defs: IAiClientToolDefinition[]) => void;

/**
 * ToolConverter — Requirement 7.
 */
@Injectable()
export class ToolConverter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ToolConverter.name);

  /** Local subscribers for the debounced+diffed toolset. */
  private readonly listeners = new Set<ToolsetListener>();

  /** Last-emitted set for diff-suppression (Req 7.5). */
  private lastEmitted: IAiClientToolDefinition[] | null = null;

  /** Debounce handle. */
  private debounceHandle?: ReturnType<typeof setTimeout>;

  /** Unsubscribe handle for the registry subscription. */
  private registryUnsub?: () => void;

  public constructor(
    @Inject(AI_TOOL_REGISTRY) private readonly registry: ToolRegistry,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter
  ) {}

  /** Wire registry subscription in the lifecycle phase. */
  public onModuleInit(): void {
    this.registryUnsub = this.registry.onChange(() => this.scheduleFlush());
  }

  /** Clean up subscriptions on module destroy. */
  public onModuleDestroy(): void {
    this.registryUnsub?.();
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.listeners.clear();
  }

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Convert a single registered entry to a JSON-schema tool definition.
   *
   * @throws {@link AiSchemaError} when conversion fails.
   */
  public convert(entry: IToolEntry): IAiClientToolDefinition {
    try {
      const parameters = toJsonSchema(entry.definition.parameters);
      return {
        name: entry.definition.name,
        description: entry.definition.description,
        parameters,
        ...(entry.definition.requiresApproval !== undefined
          ? { requiresApproval: entry.definition.requiresApproval }
          : {}),
        ...(entry.definition.priority !== undefined ? { priority: entry.definition.priority } : {}),
        ...(entry.definition.scope !== undefined ? { scope: entry.definition.scope } : {}),
      };
    } catch (err) {
      throw new AiSchemaError(
        `[ToolConverter] failed to convert schema for tool "${entry.definition.name}"`,
        entry.definition.name,
        err
      );
    }
  }

  /**
   * Snapshot of every registered tool converted to JSON-schema form.
   *
   * Called by the orchestrator to piggyback advertisements onto each
   * chat request (design decision: primary advertisement path).
   */
  public currentDefinitions(): IAiClientToolDefinition[] {
    return this.registry.all().map((entry) => this.convert(entry));
  }

  /**
   * Subscribe to debounced+diffed toolset changes.
   *
   * The listener fires at most once per {@link DEBOUNCE_MS} window, and
   * only when the current set differs from the last-emitted one.
   */
  public onChange(listener: ToolsetListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force an immediate flush of the debounced advertisement pipeline.
   *
   * Useful for tests that want deterministic emissions without waiting
   * for the timer.
   */
  public flush(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = undefined;
    this.emit();
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => {
      this.debounceHandle = undefined;
      this.emit();
    }, DEBOUNCE_MS);
  }

  private emit(): void {
    const current = this.currentDefinitions();
    if (this.lastEmitted !== null && deepEqual(this.lastEmitted, current)) {
      // Diff-suppression (Req 7.5, Property 5) — nothing changed.
      return;
    }
    this.lastEmitted = current;

    for (const listener of this.listeners) {
      try {
        listener(current);
      } catch (err) {
        this.logger.warn('[ToolConverter] change listener threw', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    void this.events?.emit(AI_EVENTS.TOOLSET_CHANGED, { tools: current });
  }
}
