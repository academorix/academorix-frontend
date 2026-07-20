/**
 * @file sdui.service.ts
 * @module @stackra/sdui/core/services
 * @description SduiService — orchestrates screen fetching + caching.
 *
 *   Cache-first: hits the {@link SchemaCache} before falling back to the
 *   injected {@link ISduiClient}. Successful loads populate the cache.
 */

import { Inject, Injectable } from '@stackra/container';
import type { IEventEmitter, ISduiClient, ISduiScreen } from '@stackra/contracts';
import { EVENT_EMITTER, SDUI_CLIENT, SDUI_EVENTS } from '@stackra/contracts';
import { Optional } from '@stackra/container';

import { SchemaCache } from './schema-cache.service';

/**
 * SduiService — the runtime's primary screen-fetch surface.
 *
 * `loadScreen(path)` — cache-lookup then network fetch.
 * `resolveScreen({resource, view})` — same, keyed by the composite name.
 * `invalidate(pathOrKey)` — clear a cached entry.
 * `prime(key, screen, etag?)` — write a screen into the cache (SSR / tests).
 */
@Injectable()
export class SduiService {
  public constructor(
    @Inject(SDUI_CLIENT) private readonly client: ISduiClient,
    private readonly cache: SchemaCache,
    @Optional() @Inject(EVENT_EMITTER) private readonly events?: IEventEmitter
  ) {}

  public async loadScreen(path: string, options: { force?: boolean } = {}): Promise<ISduiScreen> {
    if (!options.force) {
      const cached = this.cache.get(path);
      if (cached) return cached.screen;
    }
    const screen = await this.client.loadScreen(path);
    this.cache.set(path, screen);
    void this.events?.emit(SDUI_EVENTS.SCREEN_RESOLVED, { key: path });
    return screen;
  }

  public async resolveScreen(
    input: { resource: string; view: string },
    options: { force?: boolean } = {}
  ): Promise<ISduiScreen> {
    if (!this.client.resolveScreen) {
      throw new Error('[sdui] The configured ISduiClient does not implement resolveScreen().');
    }
    const key = `${input.resource}:${input.view}`;
    if (!options.force) {
      const cached = this.cache.get(key);
      if (cached) return cached.screen;
    }
    const screen = await this.client.resolveScreen(input);
    this.cache.set(key, screen);
    void this.events?.emit(SDUI_EVENTS.SCREEN_RESOLVED, { key });
    return screen;
  }

  public prime(key: string, screen: ISduiScreen, etag?: string): void {
    this.cache.set(key, screen, etag);
  }

  public invalidate(key: string): void {
    if (this.cache.invalidate(key)) {
      void this.events?.emit(SDUI_EVENTS.SCREEN_INVALIDATED, { key });
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}
