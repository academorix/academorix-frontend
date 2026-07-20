/**
 * @file mock-http-manager.ts
 * @module @stackra/http/testing
 * @description In-memory `IHttpManager` for tests.
 *
 *   Resolves named connections lazily to cached `MockHttpClient`
 *   instances — mirroring `HttpManager` — so tests can grab a
 *   connection, stub responses, and assert on recorded requests.
 */

import type {
  IHttpClient,
  IHttpClientConfig,
  IHttpConnector,
  IHttpInterceptorRegistry,
  IHttpManager,
  IHttpMiddlewareRegistry,
} from "@stackra/contracts";

import { MockHttpClient } from "./mock-http-client";

/** Minimal in-memory registry backing the mock manager. */
class MockRegistry {
  private readonly entries: Array<{ priority: number; value: unknown }> = [];
  public registerWithPriority(_name: string, value: unknown, priority: number): void {
    this.entries.push({ priority, value });
    this.entries.sort((a, b) => a.priority - b.priority);
  }
  public register(name: string, value: unknown): void {
    this.registerWithPriority(name, value, 50);
  }
  public getSorted(): unknown[] {
    return this.entries.map((e) => e.value);
  }
  public getEntries(): Array<{ priority: number; value: unknown }> {
    return [...this.entries];
  }
  public clear(): void {
    this.entries.length = 0;
  }
}

/**
 * In-memory HTTP manager for testing. Implements the full `IHttpManager`
 * contract; `connection()` hands back cached `MockHttpClient` instances.
 */
export class MockHttpManager implements IHttpManager {
  /** Resolved connections keyed by name. */
  public readonly connections = new Map<string, MockHttpClient>();

  /** Per-connection middleware registries. */
  private readonly middlewareRegistries = new Map<string, IHttpMiddlewareRegistry>();

  /** Per-connection interceptor registries. */
  private readonly interceptorRegistries = new Map<string, IHttpInterceptorRegistry>();

  /** Registered connection configs. */
  private readonly configs = new Map<string, IHttpClientConfig>();

  /** Configurable default connection name. */
  private defaultConnection = "default";

  public async connection(name?: string): Promise<IHttpClient> {
    const key = name ?? this.defaultConnection;
    const cached = this.connections.get(key);
    if (cached) return cached;
    const fresh = new MockHttpClient();
    this.connections.set(key, fresh);
    return fresh;
  }

  /**
   * Synchronous connection accessor — convenience for tests that want
   * the concrete `MockHttpClient` without awaiting.
   */
  public client(name?: string): MockHttpClient {
    const key = name ?? this.defaultConnection;
    let cached = this.connections.get(key);
    if (!cached) {
      cached = new MockHttpClient();
      this.connections.set(key, cached);
    }
    return cached;
  }

  public forgetConnection(name?: string | string[]): void {
    if (name === undefined) {
      this.connections.clear();
      return;
    }
    for (const target of Array.isArray(name) ? name : [name]) {
      this.connections.delete(target);
    }
  }

  public purge(): void {
    this.connections.clear();
    this.middlewareRegistries.clear();
    this.interceptorRegistries.clear();
  }

  public addConnection(name: string, config: IHttpClientConfig): boolean {
    if (this.configs.has(name)) return false;
    this.configs.set(name, config);
    return true;
  }

  public async getMiddlewareRegistry(name?: string): Promise<IHttpMiddlewareRegistry> {
    const key = name ?? this.defaultConnection;
    let reg = this.middlewareRegistries.get(key);
    if (!reg) {
      reg = new MockRegistry() as unknown as IHttpMiddlewareRegistry;
      this.middlewareRegistries.set(key, reg);
    }
    return reg;
  }

  public async getInterceptorRegistry(name?: string): Promise<IHttpInterceptorRegistry> {
    const key = name ?? this.defaultConnection;
    let reg = this.interceptorRegistries.get(key);
    if (!reg) {
      reg = new MockRegistry() as unknown as IHttpInterceptorRegistry;
      this.interceptorRegistries.set(key, reg);
    }
    return reg;
  }

  public getConnectionNames(): string[] {
    return Array.from(new Set([...this.configs.keys(), ...this.connections.keys()]));
  }

  public getDefaultConnectionName(): string {
    return this.defaultConnection;
  }

  public setDefaultConnectionName(name: string): void {
    this.defaultConnection = name;
  }

  public isConnectionActive(name?: string): boolean {
    return this.connections.has(name ?? this.defaultConnection);
  }

  public getActiveConnectionNames(): string[] {
    return Array.from(this.connections.keys());
  }

  public createClientFromConnector(
    _connector: IHttpConnector,
    config: Record<string, unknown>,
  ): IHttpClient {
    const name = (config["__connectionName"] as string | undefined) ?? this.defaultConnection;
    return this.client(name);
  }

  public extend(_driver: string, _factory: (config: Record<string, unknown>) => IHttpClient): void {
    /* no-op — the mock resolves every connection to a MockHttpClient */
  }
}
