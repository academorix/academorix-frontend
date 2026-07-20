/**
 * @file csp.module.ts
 * @module @stackra/csp/core
 * @description CSP DI module.
 *
 *   - `CspModule.forRoot(options)` — registers the root CSP configuration,
 *     the global registry, nonce generator, discovery loader, and service.
 *     Use in your AppModule.
 *   - `CspModule.forFeature(policy)` — registers feature-scoped CSP sources
 *     that get merged with the root config at policy generation time.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     CspModule.forRoot({
 *       scriptSrc: ["'self'", "'nonce'"],
 *       connectSrc: ["'self'", 'https://api.example.com'],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */

import { Module, type DynamicModule } from '@stackra/container';
import { CSP_CONFIG, CSP_SERVICE, CSP_REGISTRY } from '@stackra/contracts';

import { CspService } from './services/csp.service';
import { CspPolicyLoader } from './services/csp-policy-loader.service';
import { NonceGenerator } from './services/nonce-generator.service';
import { CspRegistry } from './registries/csp.registry';
import { createSeedLoader, seedLoaderToken } from '@stackra/support';
import type { CspModuleOptions } from './interfaces/csp-module-options.interface';
import type { CspFeaturePolicy } from './interfaces/csp-feature-policy.interface';

/**
 * CSP Module — Content Security Policy management with a registry system.
 *
 * The root config (`forRoot`) provides the base CSP directives. Feature
 * modules (`forFeature`) contribute additional sources that get merged at
 * policy generation time.
 */
@Module({})
export class CspModule {
  /**
   * Configure the CSP module with root directive sources. Registers the
   * `CspService`, `CspRegistry`, `NonceGenerator`, and `CspPolicyLoader`
   * as global providers.
   *
   * @param options - CSP directive configuration.
   * @returns A global dynamic module with CSP providers.
   */
  public static forRoot(options: CspModuleOptions): DynamicModule {
    return {
      module: CspModule,
      global: true,
      providers: [
        { provide: CSP_CONFIG, useValue: options },
        NonceGenerator,
        CspRegistry,
        { provide: CSP_REGISTRY, useExisting: CspRegistry },
        CspPolicyLoader,
        { provide: CSP_SERVICE, useClass: CspService },
        { provide: CspService, useExisting: CSP_SERVICE },
      ],
      exports: [CSP_CONFIG, CSP_SERVICE, CSP_REGISTRY, CspService, CspRegistry, NonceGenerator],
    };
  }

  /**
   * Register feature-scoped CSP sources.
   *
   * **Prefer the `@CspPolicy()` decorator** for automatic discovery. Use
   * `forFeature()` only when you need runtime-dynamic CSP sources or when
   * the contributing class isn't an `@Injectable()` provider.
   *
   * Seeding runs in the `onApplicationBootstrap` phase via a lifecycle
   * loader (not a factory side effect), and each call mints a unique token
   * so multiple feature registrations all run under the container's
   * last-wins token semantics.
   *
   * Accepts a single policy or an array of policies.
   *
   * @param policy - One CSP contribution, or an array of them.
   * @returns A dynamic module that seeds the policies into the registry.
   */
  public static forFeature(policy: CspFeaturePolicy | CspFeaturePolicy[]): DynamicModule {
    const policies = Array.isArray(policy) ? policy : [policy];
    return {
      module: CspModule,
      providers: [
        {
          provide: seedLoaderToken('csp-feature'),
          useFactory: (registry: CspRegistry) =>
            createSeedLoader(() => {
              for (const p of policies) registry.registerPolicy(p);
            }),
          inject: [CspRegistry],
        },
      ],
      exports: [],
    };
  }
}
