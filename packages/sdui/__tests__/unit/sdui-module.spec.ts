/**
 * @file sdui-module.spec.ts
 * @description Integration smoke tests — SDUI module resolves its
 *   registries, service, and client through the DI container.
 */

import { describe, expect, it } from 'vitest';
import { ApplicationFactory } from '@stackra/container';
import {
  SDUI_CLIENT,
  SDUI_COMPONENT_REGISTRY,
  SDUI_LAYOUT_REGISTRY,
  SDUI_SERVICE,
  type ISduiClient,
} from '@stackra/contracts';
import { ComponentRegistry } from '@/core/registries/component.registry';
import { LayoutRegistry } from '@/core/registries/layout.registry';
import { SduiService } from '@/core/services/sdui.service';
import { SduiModule } from '@/core/sdui.module';
import { createMockSduiClient } from '@/testing/create-mock-client';
import { heroScreen } from '@/testing/screens';

describe('SduiModule.forRoot', () => {
  it('wires every registry, service, and the null client by default', async () => {
    const app = await ApplicationFactory.create(SduiModule.forRoot());
    expect(app.get<ComponentRegistry>(SDUI_COMPONENT_REGISTRY)).toBeInstanceOf(ComponentRegistry);
    expect(app.get<LayoutRegistry>(SDUI_LAYOUT_REGISTRY)).toBeInstanceOf(LayoutRegistry);
    expect(app.get<SduiService>(SDUI_SERVICE)).toBeInstanceOf(SduiService);
    // The default client throws — verify identity, not behavior.
    const client = app.get<ISduiClient>(SDUI_CLIENT);
    expect(typeof client.loadScreen).toBe('function');
  });

  it('accepts a consumer-supplied client and returns scripted screens', async () => {
    const client = createMockSduiClient({ screens: { '/hero': heroScreen } });
    const app = await ApplicationFactory.create(SduiModule.forRoot({ client }));
    const service = app.get<SduiService>(SDUI_SERVICE);
    const first = await service.loadScreen('/hero');
    expect(first).toBe(heroScreen);
    // Second call hits cache — no additional client call.
    await service.loadScreen('/hero');
    expect(client.calls.filter((c) => c.method === 'loadScreen')).toHaveLength(1);
  });

  it('honors cacheTtl: 0 and always fetches from the client', async () => {
    const client = createMockSduiClient({ screens: { '/hero': heroScreen } });
    const app = await ApplicationFactory.create(SduiModule.forRoot({ client, cacheTtl: 0 }));
    const service = app.get<SduiService>(SDUI_SERVICE);
    await service.loadScreen('/hero');
    await service.loadScreen('/hero');
    expect(client.calls.filter((c) => c.method === 'loadScreen')).toHaveLength(2);
  });

  it('registers consumer-supplied components at boot', async () => {
    const app = await ApplicationFactory.create(
      SduiModule.forRoot({
        components: { CustomThing: { component: () => null } },
      })
    );
    const registry = app.get<ComponentRegistry>(SDUI_COMPONENT_REGISTRY);
    expect(registry.has('CustomThing')).toBe(true);
  });
});
