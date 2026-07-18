/**
 * @file mock-application.ts
 * @module @stackra/container/testing
 * @description In-memory `IApplication`-compatible mock container.
 *
 *   Backed by a `Map<InjectionToken, unknown>` — tokens are registered
 *   ahead of time via `.provide()` and retrieved via the standard
 *   `.get()` / `.getOptional()` / `.has()` surface.
 *
 *   For SSR-specific middleware tests, `@stackra/ssr/testing` re-exports
 *   this same shape (with a leaner surface). Consumers who inject
 *   `APPLICATION` should use this mock directly.
 */

import type { IApplication, InjectionToken } from "@stackra/contracts";

/**
 * Public surface of the mock container — extends `IApplication` with
 * test-only helpers (`provide`, `registry`, `close`).
 */
export interface IMockApplication extends IApplication {
  /** Register a value under a token. */
  provide<T>(token: InjectionToken<T>, value: T): void;
  /** Alias for `.provide()` — matches the `ApplicationBuilder.set()` naming. */
  set<T>(token: InjectionToken<T>, value: T): void;
  /** Direct access to the underlying token → value map. */
  readonly registry: Map<InjectionToken, unknown>;
  /** Resolve asynchronously (parity with `ApplicationContext.resolve`). */
  resolve<T>(token: InjectionToken<T>): Promise<T>;
  /** Clear the registry (parity with `ApplicationContext.close`). */
  close(): Promise<void>;
}

/**
 * In-memory `IApplication` implementation.
 *
 * Every method mirrors the production `ApplicationContext` surface a
 * consumer might depend on:
 * - `.get(token)` — throws when the token is not registered
 * - `.getOptional(token)` — returns `undefined` on miss
 * - `.has(token)` — non-throwing existence check
 * - `.resolve(token)` — async version of `.get()`
 */
export class MockApplication implements IMockApplication {
  public readonly registry = new Map<InjectionToken, unknown>();

  public provide<T>(token: InjectionToken<T>, value: T): void {
    this.registry.set(token as InjectionToken, value);
  }

  public set<T>(token: InjectionToken<T>, value: T): void {
    this.provide(token, value);
  }

  public get<T = unknown>(token: unknown): T {
    if (!this.registry.has(token as InjectionToken)) {
      throw new Error(
        `MockApplication: no provider registered for token "${this.tokenLabel(token)}". ` +
          "Call .provide(token, value) before requesting it.",
      );
    }
    return this.registry.get(token as InjectionToken) as T;
  }

  public getOptional<T = unknown>(token: unknown): T | undefined {
    return this.registry.get(token as InjectionToken) as T | undefined;
  }

  public has(token: unknown): boolean {
    return this.registry.has(token as InjectionToken);
  }

  public resolve<T>(token: InjectionToken<T>): Promise<T> {
    return Promise.resolve(this.get<T>(token));
  }

  public close(): Promise<void> {
    this.registry.clear();
    return Promise.resolve();
  }

  private tokenLabel(token: unknown): string {
    if (typeof token === "symbol") return token.toString();
    if (typeof token === "function") return token.name || "anonymous class";
    return String(token);
  }
}
