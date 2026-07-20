/**
 * @file context-collector.service.ts
 * @module @stackra/ai/core/services
 * @description Debounced + diffed + PII-redacted + leader-gated UI
 *   context sync pipeline.
 *
 *   Requirement traceability:
 *
 *   - 11.4 — serialize the focus stack into a snapshot preserving order.
 *   - 12.1, 12.5 — build a snapshot and send it on the context channel.
 *   - 12.2 — debounce syncs to at most one per 500ms quiet window.
 *   - 12.3 — suppress the sync when the debounced snapshot is unchanged
 *            (Property 8).
 *   - 12.4 — pass every frame through the PII redactor before inclusion.
 *   - 12.7 — enforce configurable per-frame + aggregate size caps.
 *   - 12.8 — truncate or omit oversized frames and record a diagnostic.
 *   - 13.2, 13.3 — while not leader, suppress syncs; while leader, send
 *                  (Property 9). Leadership transfer resumes syncing
 *                  (Req 13.4).
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
  AI_CLIENT,
  AI_CONFIG,
  AI_CONTEXT_REGISTRY,
  AI_EVENTS,
  AI_PII_REDACTOR,
  EVENT_EMITTER,
  type IAiClient,
  type IAiConfig,
  type IAiContextFrame,
  type IEventEmitter,
  type IUiContextSnapshot,
} from '@stackra/contracts';

import { deepEqual } from '../utils/deep-equal.util';
import { serializedSizeOf } from '../utils/byte-size.util';
import { ContextRegistry } from '../registries/context.registry';
import { PiiRedactor } from './pii-redactor.service';

/** Debounce window for context syncs, in milliseconds (Req 12.2). */
const DEFAULT_DEBOUNCE_MS = 500;
/** Default per-frame cap when config omits it, in bytes. */
const DEFAULT_MAX_FRAME_BYTES = 16_384;
/** Default aggregate snapshot cap when config omits it, in bytes. */
const DEFAULT_MAX_SNAPSHOT_BYTES = 65_536;

/** Emitted diagnostic for oversized frames (Req 12.8). */
export interface IContextDiagnostic {
  /** Frame key. */
  key: string;
  /** Serialized size in bytes. */
  bytes: number;
  /** Cap that was exceeded. */
  cap: number;
  /** How the collector handled it. */
  action: 'truncated' | 'omitted';
}

/**
 * ContextCollector — Requirements 11–13.
 */
@Injectable()
export class ContextCollector implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ContextCollector.name);

  /** Last-synced snapshot for diff-suppression (Req 12.3). */
  private lastSynced: IUiContextSnapshot | null = null;

  /** Debounce handle. */
  private debounceHandle?: ReturnType<typeof setTimeout>;

  /** Current leader state — defaults to `true` for single-tab operation. */
  private leader: boolean = true;

  /** Cleanup handle for the registry subscription. */
  private registryUnsub?: () => void;

  /** Compiled per-frame + aggregate caps. */
  private readonly maxFrameBytes: number;
  private readonly maxSnapshotBytes: number;
  private readonly debounceMs: number;
  private readonly leaderGated: boolean;

  public constructor(
    @Inject(AI_CONTEXT_REGISTRY) private readonly registry: ContextRegistry,
    @Inject(AI_PII_REDACTOR) private readonly redactor: PiiRedactor,
    @Inject(AI_CLIENT) private readonly client: IAiClient,
    @Inject(AI_CONFIG) config: IAiConfig,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter
  ) {
    this.maxFrameBytes = config.context?.maxFrameBytes ?? DEFAULT_MAX_FRAME_BYTES;
    this.maxSnapshotBytes = config.context?.maxSnapshotBytes ?? DEFAULT_MAX_SNAPSHOT_BYTES;
    this.debounceMs = config.context?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.leaderGated = config.context?.leaderGated ?? true;
  }

  // ────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────

  /** Wire registry subscription on module init. */
  public onModuleInit(): void {
    this.registryUnsub = this.registry.onChange(() => this.scheduleFlush());
  }

  /** Clean up subscription + pending timer on destroy. */
  public onModuleDestroy(): void {
    this.registryUnsub?.();
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
  }

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /**
   * Update the multi-tab leader state (Req 13). When leadership
   * transfers **to** this tab, the collector immediately schedules a
   * flush so the new leader picks up syncing (Req 13.4).
   *
   * When {@link IAiContextConfig.leaderGated} is `false` this method is
   * a no-op — the gate is always open.
   */
  public setLeader(isLeader: boolean): void {
    if (!this.leaderGated) return;
    const wasLeader = this.leader;
    this.leader = isLeader;
    if (!wasLeader && isLeader) this.scheduleFlush();
  }

  /** Whether this tab is currently the leader. */
  public isLeader(): boolean {
    return this.leader;
  }

  /**
   * Force an immediate flush of the debounced sync pipeline.
   *
   * Useful for tests that want deterministic sync emissions without
   * waiting for the timer, and for consumers that need to guarantee a
   * sync (e.g. before navigating away).
   */
  public async flush(): Promise<void> {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = undefined;
    await this.emit();
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => {
      this.debounceHandle = undefined;
      void this.emit();
    }, this.debounceMs);
  }

  private async emit(): Promise<void> {
    // Leader gate — Req 13.2.
    if (this.leaderGated && !this.leader) return;

    const snapshot = this.buildSnapshot();

    // Diff-suppression — Req 12.3.
    if (this.lastSynced !== null && deepEqual(snapshot, this.lastSynced)) return;

    this.lastSynced = snapshot;
    try {
      await this.client.syncContext(snapshot);
    } catch (err) {
      this.logger.warn('[ContextCollector] failed to sync context', {
        error: err instanceof Error ? err.message : String(err),
      });
      // Reset lastSynced so the next successful flush retries the same
      // snapshot rather than silently skipping it.
      this.lastSynced = null;
      return;
    }
    void this.events?.emit(AI_EVENTS.CONTEXT_SYNCED, { snapshot });
  }

  private buildSnapshot(): IUiContextSnapshot {
    // 1. Ordered focus stack (Req 11.4).
    const ordered = this.registry.orderedStack();
    // 2. PII redaction per frame (Req 12.4).
    const redacted = ordered.map((frame) => this.redactor.redact(frame));
    // 3. Size enforcement (Req 12.7/12.8).
    const survivors = this.enforceSize(redacted);

    return {
      focusStack: survivors.map((frame) => ({
        key: frame.key,
        priority: frame.priority,
        snapshot: frame.snapshot,
      })),
      capturedAt: Date.now(),
    };
  }

  private enforceSize(frames: readonly IAiContextFrame[]): IAiContextFrame[] {
    const output: IAiContextFrame[] = [];
    let aggregate = 0;

    for (const frame of frames) {
      const frameBytes = serializedSizeOf(frame.snapshot);
      let survivor = frame;

      // Per-frame cap (Req 12.7).
      if (frameBytes > this.maxFrameBytes) {
        this.emitDiagnostic({
          key: frame.key,
          bytes: frameBytes,
          cap: this.maxFrameBytes,
          action: 'truncated',
        });
        survivor = { ...frame, snapshot: { _truncated: true, originalBytes: frameBytes } };
      }

      // Aggregate cap (Req 12.7).
      const survivorBytes = serializedSizeOf(survivor.snapshot);
      if (aggregate + survivorBytes > this.maxSnapshotBytes) {
        this.emitDiagnostic({
          key: frame.key,
          bytes: survivorBytes,
          cap: this.maxSnapshotBytes,
          action: 'omitted',
        });
        continue;
      }

      output.push(survivor);
      aggregate += survivorBytes;
    }
    return output;
  }

  private emitDiagnostic(diagnostic: IContextDiagnostic): void {
    this.logger.warn(
      `[ContextCollector] context frame ${diagnostic.action}: ${diagnostic.key} ` +
        `(${diagnostic.bytes} bytes > cap ${diagnostic.cap})`,
      {
        key: diagnostic.key,
        bytes: diagnostic.bytes,
        cap: diagnostic.cap,
        action: diagnostic.action,
      }
    );
  }
}
