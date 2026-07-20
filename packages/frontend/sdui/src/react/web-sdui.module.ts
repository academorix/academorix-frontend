/**
 * @file web-sdui.module.ts
 * @module @stackra/sdui/react
 * @description WebSduiModule — imports `SduiModule.forRoot(...)` and
 *   seeds the component/layout registries with the web-side defaults
 *   (core primitives + HeroUI OSS baseline + built-in scene layouts).
 *
 *   Consumers pick between:
 *   - `SduiModule.forRoot(...)` — headless / native / custom registries.
 *   - `WebSduiModule.forRoot(...)` — web + HeroUI defaults out of the box.
 */

import { Module, type DynamicModule } from '@stackra/container';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';
import { SduiModule, type ISduiForRootOptions } from '../core/sdui.module';
import { ComponentRegistry } from '../core/registries/component.registry';
import { LayoutRegistry } from '../core/registries/layout.registry';
import {
  registerBuiltInLayouts,
  registerCorePrimitives,
  registerHeroUiComponents,
} from './registry';

/**
 * WebSduiModule — SDUI wired for web with the default component set.
 *
 * @example
 * ```ts
 * @Module({ imports: [WebSduiModule.forRoot({ baseUrl: '/api/sdui' })] })
 * export class AppModule {}
 * ```
 */
@Module({})
export class WebSduiModule {
  public static forRoot(options: ISduiForRootOptions = {}): DynamicModule {
    return {
      module: WebSduiModule,
      imports: [SduiModule.forRoot(options)],
      providers: [
        {
          provide: seedLoaderToken('sdui:web-registry'),
          useFactory: (components: ComponentRegistry, layouts: LayoutRegistry) =>
            createSeedLoader(() => {
              registerCorePrimitives(components);
              registerHeroUiComponents(components);
              registerBuiltInLayouts(layouts);
            }),
          inject: [ComponentRegistry, LayoutRegistry],
        },
      ],
      exports: [],
    };
  }
}
