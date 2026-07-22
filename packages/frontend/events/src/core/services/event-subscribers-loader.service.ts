/**
 * @file event-subscribers-loader.service.ts
 * @module @stackra/events/core/services
 * @description Auto-discovery of `@OnEvent` listener methods and `@EventTransport` classes.
 *   At application bootstrap:
 *   1. Walks every DI provider via the discovery service.
 *   2. Reads `@OnEvent` metadata from each method and registers the listener.
 *   3. Reads `@EventTransport` metadata from each class and connects the transport.
 *
 *   On shutdown, disconnects all transports and removes all listeners.
 */

import {
  Injectable,
  Inject,
  Optional,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@stackra/container";
import { getMetadata } from "@vivtel/metadata";

import type { IDiscoveryService, IQueueManager } from "@stackra/contracts";
import { EVENT_EMITTER, QUEUE_MANAGER } from "@stackra/contracts";
import { EVENT_TRANSPORT_METADATA, EVENT_LISTENER_METADATA } from "@/core/constants";
import { EventEmitter } from "./event-emitter.service";
import { EventTransportRegistry } from "../registries/event-transport.registry";
import { EventTransportError } from "@/core/errors";
import { DISCOVERY_SERVICE } from "@stackra/contracts";
import type { IOnEventMetadata, IOnEventOptions, IEventTransportOptions } from "@stackra/contracts";
import type { IEventTransport } from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Discovery Service Interface
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Discovers and wires every `@OnEvent`-decorated method and
 * `@EventTransport`-decorated class to the active EventEmitter.
 *
 * This is an internal service registered by the `EventEmitterModule`.
 * It runs automatically during module initialization and cleanup.
 */
@Injectable()
export class EventSubscribersLoader implements OnApplicationBootstrap, OnModuleDestroy {
  /**
   * @param emitter - The active EventEmitter instance
   * @param transportRegistry - Registry for tracking connected transports
   * @param discoveryService - Optional provider scanner (absent in tests)
   * @param queueManager - Optional queue manager for `@OnEvent({ queued: true })`
   *   listeners. When absent, queued listeners fall back to synchronous
   *   execution. Resolved via DI (`@Inject(QUEUE_MANAGER)`) — used to
   *   read `(globalThis as any).__stackra_queue_manager__`, which was
   *   dead code (nothing wrote that slot).
   */
  public constructor(
    @Inject(EVENT_EMITTER) private readonly emitter: EventEmitter,
    private readonly transportRegistry: EventTransportRegistry,
    @Optional() @Inject(DISCOVERY_SERVICE) private readonly discoveryService?: IDiscoveryService,
    @Optional() @Inject(QUEUE_MANAGER) private readonly queueManager?: IQueueManager,
  ) {}

  /**
   * Run the discovery pass after every module has initialised. Scans all
   * providers for `@OnEvent` and `@EventTransport` metadata.
   *
   * Container-wide discovery must run in `onApplicationBootstrap` so
   * listeners/transports from later-initialised modules aren't missed. Note:
   * this binds listeners *after* all `onModuleInit` hooks — events emitted
   * during another module's `onModuleInit` are intentionally not delivered
   * (bindings are now deterministic: complete before the app starts).
   */
  public onApplicationBootstrap(): void {
    this.loadEventListeners();
    this.loadEventTransports();
  }

  /**
   * Clean up on shutdown — disconnect transports and remove all listeners.
   */
  public onModuleDestroy(): void {
    this.transportRegistry.disconnectAll();
    this.emitter.removeAllListeners();
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Listener Discovery
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Walk every provider and register every `@OnEvent`-tagged method.
   */
  private loadEventListeners(): void {
    if (!this.discoveryService) return;
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance) as object | null;
      if (!prototype) continue;

      const methodNames = this.getAllMethodNames(prototype);

      for (const methodKey of methodNames) {
        this.subscribeIfListener(instance as Record<string, unknown>, methodKey);
      }
    }
  }

  /**
   * Check a method for `@OnEvent` metadata and subscribe it to the emitter.
   *
   * The `@OnEvent` decorator stamps metadata on the class prototype at
   * (prototype, propertyKey) via `defineMetadata(key, value, target,
   * propertyKey)`. Reading from the method function directly returns
   * `undefined` — the reader and writer must agree on the target.
   *
   * Normalises the raw stamp into an array: `@OnEvent` accumulates
   * repeated applications into a `IOnEventMetadata[]` array, but the
   * initial single-application stamp is a bare `IOnEventMetadata`
   * (matches the `createDiscoverableMethodDecorator` `merge` shape).
   *
   * @param instance - The provider instance
   * @param methodKey - Method name to check
   */
  private subscribeIfListener(instance: Record<string, unknown>, methodKey: string): void {
    const method = instance[methodKey];
    if (typeof method !== "function") return;

    // Read against the prototype + propertyKey — matches what
    // `defineMetadata` writes inside the `@OnEvent` decorator.
    const prototype = Object.getPrototypeOf(instance);
    if (!prototype) return;

    const raw = getMetadata<IOnEventMetadata | IOnEventMetadata[]>(
      EVENT_LISTENER_METADATA,
      prototype,
      methodKey,
    );

    if (raw === undefined) return;
    const metadatas: readonly IOnEventMetadata[] = Array.isArray(raw) ? raw : [raw];

    if (metadatas.length === 0) return;

    for (const metadata of metadatas) {
      const { event, options } = metadata;
      const events = Array.isArray(event) ? event : [event];

      for (const eventName of events) {
        let listenerFn: (...args: unknown[]) => unknown;

        if (options?.queued) {
          // Queued listener — dispatch to queue instead of executing inline
          listenerFn = (...args: unknown[]) =>
            this.dispatchToQueue(instance, methodKey, eventName, args, options);
        } else {
          // Standard inline listener
          listenerFn = (...args: unknown[]) => this.safeInvoke(instance, methodKey, args, options);
        }

        if (options?.once) {
          this.emitter.once(eventName, listenerFn);
        } else if (options?.prependListener) {
          this.emitter.prependListener(eventName, listenerFn);
        } else {
          this.emitter.on(eventName, listenerFn);
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Transport Discovery
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Walk every provider and connect every `@EventTransport`-tagged class.
   */
  private loadEventTransports(): void {
    if (!this.discoveryService) return;
    const providers = this.discoveryService.getProvidersByMetadata(EVENT_TRANSPORT_METADATA);

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const ctor = (instance as { constructor?: Function }).constructor;
      if (!ctor) continue;

      const transportOptions = getMetadata<IEventTransportOptions>(
        EVENT_TRANSPORT_METADATA,
        ctor as object,
      );

      if (!transportOptions) continue;

      const transport = instance as IEventTransport;
      if (typeof transport.connect !== "function") {
        throw new EventTransportError(
          `Transport "${transportOptions.name}" does not implement IEventTransport.connect().`,
        );
      }

      // Connect the transport to the emitter
      transport.connect(this.emitter);
      this.transportRegistry.register(transportOptions.name, transport);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Invoke a listener method with error suppression (default) or propagation.
   *
   * @param instance - Provider instance
   * @param methodKey - Method name
   * @param args - Arguments to forward
   * @param options - Listener options (suppressErrors)
   * @returns The method's return value
   */
  private async safeInvoke(
    instance: Record<string, unknown>,
    methodKey: string,
    args: unknown[],
    options?: IOnEventOptions,
  ): Promise<unknown> {
    try {
      const method = instance[methodKey] as (...a: unknown[]) => unknown;
      return await method.call(instance, ...args);
    } catch (err: Error | any) {
      if (options?.suppressErrors ?? true) {
        // Suppress by default — log but don't propagate
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Read every method name on a prototype (excluding constructor).
   *
   * @param prototype - The prototype to inspect
   * @returns Array of method names
   */
  private getAllMethodNames(prototype: object): string[] {
    const methods: string[] = [];
    const descriptors = Object.getOwnPropertyDescriptors(prototype);

    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (key === "constructor") continue;
      if (typeof descriptor.value === "function") {
        methods.push(key);
      }
    }

    return methods;
  }

  /**
   * Dispatch a listener invocation to the queue system as a background job.
   *
   * Falls back to synchronous execution if the queue system is not available.
   * The job payload contains the class name, method name, and event args so
   * the worker can reconstruct and invoke the listener.
   *
   * @param instance - Provider instance
   * @param methodKey - Method name to invoke
   * @param eventName - The event that fired
   * @param args - Event arguments
   * @param options - Listener options (queue name, delay)
   */
  private async dispatchToQueue(
    instance: Record<string, unknown>,
    methodKey: string,
    eventName: string | symbol,
    args: unknown[],
    options?: IOnEventOptions,
  ): Promise<void> {
    // DI-wired path — the queue manager is resolved via `@Inject(QUEUE_MANAGER)`
    // when `@stackra/queue`'s `QueueModule` is imported. When it's absent, the
    // optional injection leaves `this.queueManager` undefined and we fall
    // through to sync execution.
    //
    // The prior implementation read `(globalThis as any).__stackra_queue_manager__`
    // and expected some other code to write that slot — nothing ever did, so
    // the queued branch was dead code. Fix per
    // `.kiro/reports/container-di-architecture-reviewer-2026-07-21.md` §P0-1.
    if (this.queueManager) {
      try {
        const queueName = options?.queue ?? "events";
        const className = (instance.constructor as Function).name;
        await this.queueManager.dispatch(
          `event-listener:${className}.${methodKey}`,
          { event: String(eventName), args, className, methodKey },
          { queue: queueName, delayMs: options?.delay },
        );
        return;
      } catch {
        // Queue dispatch failed — fall through to sync so the listener
        // still fires locally rather than being dropped entirely.
      }
    }

    // Fallback: execute synchronously.
    await this.safeInvoke(instance, methodKey, args, options);
  }
}
