// @vitest-environment node
/**
 * @file devtools-for-feature.spec.ts
 * @module @stackra/devtools/tests/unit
 * @description Behavioural spec for `DevtoolsModule.forFeature(...)`
 *   and `DevtoolsModule.forInspectorSource(...)` when the devtools
 *   registries are absent — i.e. the consumer app did NOT import
 *   `DevtoolsModule.forRoot()`.
 *
 *   The fail-soft contract is: a feature package can declare
 *   `DevtoolsModule.forFeature([Panel])` unconditionally. When the
 *   host app has no root devtools wiring, the seed-loader factories
 *   receive `undefined` for the missing registry, return a no-op
 *   seed loader, and the container bootstrap succeeds instead of
 *   failing with "Cannot resolve factory dependency
 *   'Symbol(DEVTOOLS_REGISTRY)'".
 */

import 'reflect-metadata';

import { describe, expect, it } from 'vitest';
import { ApplicationFactory } from '@stackra/container';
import { Injectable, Module } from '@stackra/container';
import type {
  DevtoolsCategory,
  IDevtoolsInspectorRegion,
  IDevtoolsInspectorRegionSource,
  IDevtoolsPanel,
  IDevtoolsView,
} from '@stackra/contracts';

import { DevtoolsModule } from '@/core/devtools.module';
import { DevtoolsPanel } from '@/core/decorators/devtools-panel.decorator';
import { DevtoolsInspectorSource } from '@/core/decorators/devtools-inspector-source.decorator';
import { DevtoolsPanelsRegistry } from '@/core/registries/devtools-panels.registry';
import { DevtoolsInspectorRegistry } from '@/core/registries/devtools-inspector.registry';

// ────────────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────────────

/**
 * A minimal `IDevtoolsPanel` used as the seed target across the specs.
 *
 * The panel is a trivial no-op — the specs care about whether the
 * container resolves the seed loader, not what the panel renders.
 */
@Injectable()
@DevtoolsPanel({
  id: 'test-panel',
  title: 'Test panel',
  category: 'framework',
  order: 100,
})
class TestPanel implements IDevtoolsPanel {
  public readonly id = 'test-panel';
  public readonly title = 'Test panel';
  public readonly category: DevtoolsCategory = 'framework';
  public readonly order = 100;
  public readonly view: IDevtoolsView = {
    type: 'component',
    render: (): null => null,
  };
}

/**
 * A minimal `IDevtoolsInspectorRegionSource` used as the seed target.
 */
@Injectable()
@DevtoolsInspectorSource({
  id: 'test-inspector-source',
  panelId: 'test-panel',
  label: 'Test source',
})
class TestInspectorSource implements IDevtoolsInspectorRegionSource {
  public readonly id = 'test-inspector-source';
  public readonly label = 'Test source';
  public readonly panelId = 'test-panel';

  public collect(): readonly IDevtoolsInspectorRegion[] {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────
// Specs — standalone (no forRoot) fail-soft
// ────────────────────────────────────────────────────────────────────────

describe('DevtoolsModule.forFeature (standalone)', () => {
  it('bootstraps without DevtoolsModule.forRoot() — the panel seed loader is a no-op', async () => {
    // The consumer app imports ONLY the feature module. This mirrors
    // a feature-package call site (e.g. CacheModule) whose consumer
    // hasn't wired devtools at the app root.
    @Module({
      imports: [DevtoolsModule.forFeature([TestPanel])],
    })
    class AppModule {}

    // Bootstrap must not throw — the missing DEVTOOLS_REGISTRY is
    // treated as optional at the seed-loader factory level.
    const app = await ApplicationFactory.create(AppModule);

    // The panel class itself is still resolvable through the
    // container (it's listed in the module's providers).
    const panel = app.get(TestPanel);
    expect(panel).toBeInstanceOf(TestPanel);

    await app.close();
  });

  it('bootstraps without DevtoolsModule.forRoot() — the inspector-source seed loader is a no-op', async () => {
    @Module({
      imports: [DevtoolsModule.forInspectorSource([TestInspectorSource])],
    })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);
    const source = app.get(TestInspectorSource);
    expect(source).toBeInstanceOf(TestInspectorSource);

    await app.close();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — with forRoot the panel + source are seeded normally
// ────────────────────────────────────────────────────────────────────────

describe('DevtoolsModule.forFeature (with forRoot)', () => {
  it('registers the panel with the panels registry when forRoot is present', async () => {
    @Module({
      imports: [DevtoolsModule.forRoot(), DevtoolsModule.forFeature([TestPanel])],
    })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);
    const registry = app.get(DevtoolsPanelsRegistry);
    // The seed loader ran at onApplicationBootstrap — the panel is
    // now in the registry alongside any auto-discovered ones.
    expect(registry.find('test-panel')).not.toBeNull();

    await app.close();
  });

  it('registers the inspector source with the inspector registry when forRoot is present', async () => {
    @Module({
      imports: [DevtoolsModule.forRoot(), DevtoolsModule.forInspectorSource([TestInspectorSource])],
    })
    class AppModule {}

    const app = await ApplicationFactory.create(AppModule);
    const registry = app.get(DevtoolsInspectorRegistry);
    const sources = registry.sources();
    expect(sources.some((s) => s.id === 'test-inspector-source')).toBe(true);

    await app.close();
  });
});
