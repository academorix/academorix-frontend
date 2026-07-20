/**
 * @file connection-manager.service.ts
 * @module @stackra/ai/core/services
 * @description Owns the observable {@link AiConnectionState} and drives
 *   the reconnection policy. Overlays offline detection on top of the
 *   transport state so consumers see a single unified state.
 *
 *   Requirements covered:
 *
 *   - 24.1 — expose Connecting/Connected/Disconnected/Error/Offline.
 *   - 24.2 — reconnect according to a configurable retry policy.
 *   - 24.3 — bounded exponential backoff with a configurable max attempts
 *            (validated by Property 11).
 *   - 24.4 — expose resume context (runId + rendered message ids) so the
 *            orchestrator can reopen without duplicating messages.
 *   - 24.5 — surface an `offline` state that components can render.
 *   - 24.6 — while not connected, the reason surfaces via `.reason`.
 *
 *   The manager does NOT reopen the stream itself — that is the
 *   `ChatOrchestrator`'s job. It provides three primitives the
 *   orchestrator composes:
 *
 *   - `scheduleReconnect()` — returns the next backoff delay + attempt
 *     index, or `null` when `maxAttempts` is exceeded.
 *   - `resetBackoff()` — call on a healthy stream so the next disconnect
 *     starts a fresh backoff sequence.
 *   - `noteRunActive(runId, messageIds)` / `noteRunFinished()` — keep
 *     resume context aligned with what the UI has already rendered.
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
  AI_CONFIG,
  AI_EVENTS,
  AI_TRANSPORT,
  AiConnectionState,
  EVENT_EMITTER,
  NETWORK_DETECTOR,
  type IAiConfig,
  type IAiRetryPolicy,
  type IAiTransport,
  type IEventEmitter,
  type INetworkDetector,
  type INetworkStatus,
} from '@stackra/contracts';

import { computeBackoff } from '../utils/backoff.util';

/** Reason surfaced to hooks/components while the manager is not `Connected`. */
export interface IConnectionReason {
  /** Non-connected state producing the reason. */
  state: AiConnectionState;
  /** Human-readable explanation. */
  message: string;
}

/** Snapshot of resume-idempotency context for the orchestrator. */
export interface IResumeContext {
  /** Active run id, when the orchestrator has one. */
  runId?: string;
  /** Message ids already rendered — used to skip duplicates on resume. */
  messageIds: string[];
}

/** Result of `scheduleReconnect()` — a bounded backoff step. */
export interface IReconnectSchedule {
  /** Zero-based attempt index for this step. */
  attempt: number;
  /** Delay to wait before attempting the reconnect, in ms. */
  delayMs: number;
}

/** Listener invoked when the observed state changes. */
export type ConnectionStateListener = (
  state: AiConnectionState,
  reason?: IConnectionReason
) => void;

/** Fallback retry policy applied if the config omits one (unreachable when
 *  `mergeConfig` runs, but keeps this service standalone-usable in tests). */
const FALLBACK_RETRY_POLICY: IAiRetryPolicy = { maxAttempts: 5, baseMs: 500, capMs: 15_000 };

/**
 * ConnectionManager — Requirement 24.
 */
@Injectable()
export class ConnectionManager implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionManager.name);

  /** Composed state (transport + offline overlay). */
  private _state: AiConnectionState = AiConnectionState.Disconnected;

  /** Human-readable reason surfaced when `_state !== Connected`. */
  private _reason: IConnectionReason | undefined;

  /** Raw transport state, before the offline overlay. */
  private transportState: AiConnectionState = AiConnectionState.Disconnected;

  /** Whether the device currently has connectivity. */
  private online: boolean = true;

  /** Zero-based count of reconnect attempts already scheduled. */
  private attempts: number = 0;

  /** Active run context for resume-without-duplicate rendering (Req 24.4). */
  private resumeContext: IResumeContext | null = null;

  /** State-change subscribers. */
  private readonly listeners = new Set<ConnectionStateListener>();

  /** Unsubscribe handle for the transport state subscription. */
  private transportUnsub?: () => void;

  /** Cleanup handle for optional online/offline detection. */
  private networkUnsub?: () => void;

  /**
   * @param config - Resolved AI configuration (for retryPolicy).
   * @param transport - The active transport; optional so unit tests can
   *   construct the manager standalone.
   * @param detector - Optional network detector (`@stackra/network`).
   *   Falls back to `navigator.onLine` + `online`/`offline` DOM events.
   * @param events - Optional event emitter for `AI_EVENTS.CONNECTION_CHANGED`.
   */
  public constructor(
    @Inject(AI_CONFIG) private readonly config: IAiConfig,
    @Optional() @Inject(AI_TRANSPORT) private readonly transport?: IAiTransport,
    @Optional() @Inject(NETWORK_DETECTOR) private readonly detector?: INetworkDetector,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ────────────────────────────────────────────────────────────────────

  /** @inheritdoc */
  public onModuleInit(): void {
    this.attachTransport();
    this.attachOfflineDetection();
    this.recompute();
  }

  /** @inheritdoc */
  public onModuleDestroy(): void {
    this.transportUnsub?.();
    this.networkUnsub?.();
    this.listeners.clear();
  }

  // ────────────────────────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────────────────────────

  /** The composed connection state. */
  public get state(): AiConnectionState {
    return this._state;
  }

  /** Reason surfaced while `state !== Connected`. */
  public get reason(): IConnectionReason | undefined {
    return this._reason;
  }

  /** Whether chat submission should be enabled. */
  public get isConnected(): boolean {
    return this._state === AiConnectionState.Connected;
  }

  /** Whether the device believes it is currently online. */
  public get isOnline(): boolean {
    return this.online;
  }

  /** Zero-based count of reconnect attempts already scheduled since the last reset. */
  public get attemptCount(): number {
    return this.attempts;
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  public onStateChange(listener: ConnectionStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ── Reconnect coordination ─────────────────────────────────────────────

  /**
   * Compute the next reconnect step (Req 24.3).
   *
   * @returns The delay and attempt index, or `null` when the policy's
   *   `maxAttempts` has been exhausted.
   */
  public scheduleReconnect(): IReconnectSchedule | null {
    const policy = this.retryPolicy();
    if (this.attempts >= policy.maxAttempts) {
      return null;
    }
    const attempt = this.attempts;
    const delayMs = computeBackoff(attempt, policy);
    this.attempts += 1;
    return { attempt, delayMs };
  }

  /**
   * Reset the reconnect-attempts counter. Call after a healthy stream so
   * the next disconnect starts a fresh backoff sequence.
   */
  public resetBackoff(): void {
    this.attempts = 0;
  }

  // ── Resume context (Req 24.4) ─────────────────────────────────────────

  /**
   * Record that a run is active, along with the message ids already
   * rendered. The orchestrator passes these back to the backend on
   * resume so already-shown assistant text is not re-rendered.
   */
  public noteRunActive(runId: string | undefined, messageIds: readonly string[]): void {
    this.resumeContext = { runId, messageIds: [...messageIds] };
  }

  /** Note that the active run has finished; clears resume context. */
  public noteRunFinished(): void {
    this.resumeContext = null;
    this.resetBackoff();
  }

  /**
   * Get the resume context. Consumers pass this to the backend on
   * reconnect to skip already-rendered content.
   *
   * @returns The last active run and its rendered message ids, or `null`.
   */
  public getResumeContext(): IResumeContext | null {
    if (!this.resumeContext) return null;
    return {
      runId: this.resumeContext.runId,
      messageIds: [...this.resumeContext.messageIds],
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal
  // ────────────────────────────────────────────────────────────────────

  /** Look up the effective retry policy from config or fall back. */
  private retryPolicy(): IAiRetryPolicy {
    return this.config.retryPolicy ?? FALLBACK_RETRY_POLICY;
  }

  private attachTransport(): void {
    if (!this.transport) return;
    this.transportState = this.transport.state;
    this.transportUnsub = this.transport.onStateChange((s) => {
      this.transportState = s;
      this.recompute();
    });
  }

  private attachOfflineDetection(): void {
    // Injected detector wins (Req composes @stackra/network when present).
    if (this.detector) {
      this.online = this.detector.isOnline();
      this.networkUnsub = this.detector.subscribe((status: INetworkStatus) => {
        const wasOnline = this.online;
        this.online = status.isOnline;
        if (wasOnline !== this.online) this.recompute();
      });
      return;
    }
    // Fallback: `navigator.onLine` + `online`/`offline` DOM events (web only).
    if (
      typeof globalThis !== 'undefined' &&
      typeof (globalThis as { navigator?: { onLine?: boolean } }).navigator !== 'undefined'
    ) {
      const nav = (globalThis as { navigator: { onLine?: boolean } }).navigator;
      this.online = nav.onLine ?? true;

      const win = (
        globalThis as {
          window?: EventTarget & {
            addEventListener?: (t: string, l: () => void) => void;
            removeEventListener?: (t: string, l: () => void) => void;
          };
        }
      ).window;
      if (win && typeof win.addEventListener === 'function') {
        const goOnline = (): void => {
          this.online = true;
          this.recompute();
        };
        const goOffline = (): void => {
          this.online = false;
          this.recompute();
        };
        win.addEventListener('online', goOnline);
        win.addEventListener('offline', goOffline);
        this.networkUnsub = (): void => {
          win.removeEventListener?.('online', goOnline);
          win.removeEventListener?.('offline', goOffline);
        };
      }
    }
  }

  /**
   * Compose transport state + offline overlay into `_state`, populate
   * `_reason`, notify listeners, emit `CONNECTION_CHANGED`.
   */
  private recompute(): void {
    const next = this.online ? this.transportState : AiConnectionState.Offline;
    const reason = this.buildReason(next);

    // Skip no-op updates so listeners aren't spammed by transport churn.
    if (this._state === next && sameReason(this._reason, reason)) {
      return;
    }

    this._state = next;
    this._reason = reason;

    for (const listener of this.listeners) {
      try {
        listener(next, reason);
      } catch (err) {
        this.logger.warn('[ConnectionManager] state listener threw', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Fire-and-forget; don't block on subscribers.
    void this.events?.emit(AI_EVENTS.CONNECTION_CHANGED, { state: next, reason });
  }

  /** Build the human-readable reason surfaced with a non-Connected state. */
  private buildReason(state: AiConnectionState): IConnectionReason | undefined {
    switch (state) {
      case AiConnectionState.Connected:
        return undefined;
      case AiConnectionState.Connecting:
        return { state, message: 'Connecting to the AI backend…' };
      case AiConnectionState.Disconnected:
        return { state, message: 'Not connected to the AI backend.' };
      case AiConnectionState.Error:
        return { state, message: 'The AI connection is in an error state.' };
      case AiConnectionState.Offline:
        return { state, message: 'The device is offline.' };
    }
  }
}

/** Structural equality for two optional reasons. */
function sameReason(a: IConnectionReason | undefined, b: IConnectionReason | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.state === b.state && a.message === b.message;
}
