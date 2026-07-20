/**
 * CircuitBreakerService.
 *
 * One circuit breaker per endpoint — three-state machine that fails
 * fast when an endpoint is unhealthy and probes recovery on a timer.
 *
 * @module @stackra/http/services/circuit-breaker
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import {
  CircuitBreakerState,
  HTTP_CONFIG,
  type IEventEmitter,
  type IHttpCircuitBreakerConfig,
  type IHttpCircuitBreakerStats,
  type IHttpModuleOptions,
  EVENT_EMITTER,
  HTTP_EVENTS,
} from "@stackra/contracts";

import { DEFAULT_CIRCUIT_BREAKER } from "../constants";

/**
 * One breaker per endpoint.
 */
class CircuitBreaker {
  /** Current state. */
  private state: CircuitBreakerState = CircuitBreakerState.Closed;

  /** Consecutive failure counter (Closed). */
  private failureCount: number = 0;

  /** Successful probe counter (HalfOpen). */
  private successCount: number = 0;

  /** Probe attempt counter (HalfOpen). */
  private halfOpenAttempts: number = 0;

  /** Epoch ms the breaker last opened. */
  private openedAt: number | null = null;

  /**
   * @param config            - Behaviour configuration.
   * @param onStateTransition - Callback fired on every transition so
   *   the service can emit lifecycle events.
   */
  public constructor(
    private readonly config: IHttpCircuitBreakerConfig,
    private readonly onStateTransition?: (next: CircuitBreakerState) => void,
  ) {}

  /** Whether this breaker should reject the next request. */
  public isOpen(): boolean {
    if (this.state === CircuitBreakerState.Open) {
      if (this.shouldTransitionToHalfOpen()) {
        this.transitionToHalfOpen();
        return false;
      }
      return true;
    }

    if (this.state === CircuitBreakerState.HalfOpen) {
      if (this.halfOpenAttempts >= this.config.halfOpenRequests) {
        return true;
      }
      this.halfOpenAttempts++;
      return false;
    }

    return false;
  }

  /** Record a successful response. */
  public recordSuccess(): void {
    if (this.state === CircuitBreakerState.HalfOpen) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitBreakerState.Closed) {
      this.failureCount = 0;
    }
  }

  /** Record a failed response. */
  public recordFailure(): void {
    if (this.state === CircuitBreakerState.Closed) {
      this.failureCount++;
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    } else if (this.state === CircuitBreakerState.HalfOpen) {
      this.transitionToOpen();
    }
  }

  /** Read the current state. */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /** Read live telemetry for this breaker. */
  public getStats(): IHttpCircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenAttempts: this.halfOpenAttempts,
      openedAt: this.openedAt,
      isOpen: this.state === CircuitBreakerState.Open,
      isHalfOpen: this.state === CircuitBreakerState.HalfOpen,
      isClosed: this.state === CircuitBreakerState.Closed,
    };
  }

  /** Reset to the initial Closed state. */
  public reset(): void {
    this.state = CircuitBreakerState.Closed;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.openedAt = null;
  }

  /** Whether enough cool-down time has elapsed to probe recovery. */
  private shouldTransitionToHalfOpen(): boolean {
    if (this.openedAt === null) return false;
    return Date.now() - this.openedAt >= this.config.timeout;
  }

  /** Move to Open state. */
  private transitionToOpen(): void {
    this.state = CircuitBreakerState.Open;
    this.openedAt = Date.now();
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.onStateTransition?.(CircuitBreakerState.Open);
  }

  /** Move to HalfOpen state. */
  private transitionToHalfOpen(): void {
    this.state = CircuitBreakerState.HalfOpen;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.onStateTransition?.(CircuitBreakerState.HalfOpen);
  }

  /** Move back to Closed state. */
  private transitionToClosed(): void {
    this.state = CircuitBreakerState.Closed;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.openedAt = null;
    this.onStateTransition?.(CircuitBreakerState.Closed);
  }
}

/**
 * Per-endpoint circuit breaker service.
 */
@Injectable()
export class CircuitBreakerService {
  /** Active breakers keyed by endpoint identifier. */
  private readonly breakers: Map<string, CircuitBreaker> = new Map();

  /** Resolved configuration. */
  private readonly config: IHttpCircuitBreakerConfig;

  /**
   * @param httpConfig    - Top-level module options. Used to read the
   *   default-connection's circuit-breaker config.
   * @param eventEmitter  - Optional emitter for lifecycle events.
   */
  public constructor(
    @Inject(HTTP_CONFIG) httpConfig: IHttpModuleOptions,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
  ) {
    const defaultConn = httpConfig.connections[httpConfig.default];
    this.config = defaultConn?.circuitBreaker ?? DEFAULT_CIRCUIT_BREAKER;
  }

  /**
   * Resolve the breaker for an endpoint, creating it on first call.
   *
   * @param endpoint - Endpoint identifier (`"{METHOD}:{URL}"`).
   */
  public getBreaker(endpoint: string): CircuitBreaker {
    let breaker = this.breakers.get(endpoint);
    if (!breaker) {
      breaker = new CircuitBreaker(this.config, (state) => {
        this.emitTransition(endpoint, state);
      });
      this.breakers.set(endpoint, breaker);
    }
    return breaker;
  }

  /**
   * Read the current state for an endpoint.
   *
   * @param endpoint - Endpoint identifier.
   */
  public getState(endpoint: string): CircuitBreakerState | null {
    return this.breakers.get(endpoint)?.getState() ?? null;
  }

  /**
   * Read the breaker stats for an endpoint.
   *
   * @param endpoint - Endpoint identifier.
   */
  public getStats(endpoint: string): IHttpCircuitBreakerStats | null {
    return this.breakers.get(endpoint)?.getStats() ?? null;
  }

  /**
   * Reset a single breaker.
   *
   * @param endpoint - Endpoint identifier.
   */
  public reset(endpoint: string): void {
    this.breakers.get(endpoint)?.reset();
  }

  /** Drop every breaker. */
  public clear(): void {
    this.breakers.clear();
  }

  /** Emit a lifecycle event when a breaker changes state. */
  private emitTransition(endpoint: string, state: CircuitBreakerState): void {
    if (!this.eventEmitter) return;

    const event =
      state === CircuitBreakerState.Open
        ? HTTP_EVENTS.CIRCUIT_OPENED
        : state === CircuitBreakerState.HalfOpen
          ? HTTP_EVENTS.CIRCUIT_HALF_OPENED
          : HTTP_EVENTS.CIRCUIT_CLOSED;
    try {
      this.eventEmitter.emit(event, { endpoint, state });
    } catch {
      /* swallow — observer errors must not affect breaker behaviour */
    }
  }
}
