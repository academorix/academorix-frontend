/**
 * @file seo.module.ts
 * @module @stackra/routing/seo
 * @description DI module for the SEO subsystem.
 *
 *   Registers `SeoService`. The site-wide SEO defaults are read from
 *   `ROUTING_CONFIG` (see `SeoService`) so the sub-module doesn't
 *   maintain its own config binding.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { SeoService } from "./services/seo.service";

/**
 * The SEO DI module.
 */
@Module({})
export class SeoModule {
  /**
   * Global registration — wires `SeoService`.
   */
  public static forRoot(): DynamicModule {
    return {
      module: SeoModule,
      global: true,
      providers: [SeoService],
      exports: [SeoService],
    };
  }
}
