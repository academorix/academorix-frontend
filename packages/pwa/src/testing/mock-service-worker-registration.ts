/**
 * @file mock-service-worker-registration.ts
 * @module @stackra/pwa/testing
 * @description Minimal `ServiceWorkerRegistration` stand-in for tests.
 *
 *   Covers the subset `PwaService.bindServiceWorker` reads:
 *   `waiting`, `installing`, `addEventListener('updatefound')`,
 *   `update()`. Add fields as needed on real tests.
 */

type Listener = (event?: Event) => void;

/** Minimal `ServiceWorker` shape — matches what tests interact with. */
export interface IMockServiceWorker {
  /** Simulated worker state. */
  state: ServiceWorkerState;
  /** Records `postMessage` calls for assertions. */
  readonly messages: unknown[];
  /** Simulate a `statechange` event with the given next state. */
  simulateStateChange(next: ServiceWorkerState): void;
  /** Add a `statechange` listener (matches the real API). */
  addEventListener(type: 'statechange', listener: Listener): void;
  /** Remove a `statechange` listener. */
  removeEventListener(type: 'statechange', listener: Listener): void;
  /** Send a message to the worker. */
  postMessage(message: unknown): void;
}

/** Create a minimal `IMockServiceWorker`. */
function createMockServiceWorker(
  initialState: ServiceWorkerState = 'installed'
): IMockServiceWorker {
  const listeners = new Map<string, Set<Listener>>();
  const messages: unknown[] = [];
  return {
    state: initialState,
    messages,
    simulateStateChange(next: ServiceWorkerState) {
      this.state = next;
      const set = listeners.get('statechange');
      if (!set) return;
      for (const listener of set) listener();
    },
    addEventListener(type, listener) {
      const set = listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    postMessage(message: unknown) {
      messages.push(message);
    },
  };
}

/**
 * Test double implementing the subset of
 * `ServiceWorkerRegistration` used by `PwaService`.
 */
export class MockServiceWorkerRegistration {
  /** Reachable via `installing` after `simulateUpdateFound()`. */
  public installing: IMockServiceWorker | null = null;

  /** Reachable via `waiting` after `simulateWaiting()`. */
  public waiting: IMockServiceWorker | null = null;

  /** How many times `update()` has been called. */
  public updateCalls = 0;

  private readonly listeners = new Map<string, Set<Listener>>();

  public constructor(
    options: {
      /** Seed the `waiting` slot immediately (for "update ready at bind" cases). */
      readonly waiting?: boolean;
    } = {}
  ) {
    if (options.waiting) this.waiting = createMockServiceWorker('installed');
  }

  /** Fire the `updatefound` event with a new installing worker. */
  public simulateUpdateFound(installing?: IMockServiceWorker): IMockServiceWorker {
    const worker = installing ?? createMockServiceWorker('installing');
    this.installing = worker;
    const set = this.listeners.get('updatefound');
    if (set) for (const listener of set) listener();
    return worker;
  }

  /** Set the `waiting` slot without dispatching an event. */
  public simulateWaiting(worker?: IMockServiceWorker): IMockServiceWorker {
    const next = worker ?? createMockServiceWorker('installed');
    this.waiting = next;
    return next;
  }

  public addEventListener(type: 'updatefound', listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }

  public removeEventListener(type: 'updatefound', listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }

  public async update(): Promise<void> {
    this.updateCalls += 1;
  }
}
