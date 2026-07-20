/**
 * @file web-consent.module.ts
 * @module @stackra/consent/react
 * @description Web-flavoured alias of `ConsentModule.forRoot` kept
 *   for backward compatibility.
 *
 *   Prior versions of the package shipped a `LocalStorageConsentAdapter`
 *   and wired it here. Since v0.2 the adapter layer is unified —
 *   consent persistence is delegated to `@stackra/storage`. Apps set
 *   `storageInstance: 'consent'` (or any name) on `ConsentModule.forRoot`
 *   and configure a matching store in their `WebStorageModule.forRoot`.
 *
 *   This module now just calls `ConsentModule.forRoot(options)` — it
 *   exists so existing imports keep working. New code should import
 *   `ConsentModule` directly from `@stackra/consent`.
 */

import { Module, type DynamicModule } from "@stackra/container";

import { ConsentModule } from "../core/consent.module";
import type { IConsentModuleOptions } from "../core/types";

/**
 * Backward-compatible alias — same as `ConsentModule.forRoot(...)`.
 *
 * @deprecated Use `ConsentModule.forRoot({ storageInstance: '<name>' })`
 *   directly. Kept for callers that already import `WebConsentModule`.
 */
@Module({})
export class WebConsentModule {
  /**
   * Register the consent module. Storage persistence is configured
   * through `options.storageInstance` — see `ConsentModule.forRoot`.
   *
   * @param options - Consent module configuration.
   * @returns The `ConsentModule.forRoot(options)` dynamic module.
   */
  public static forRoot(options: Partial<IConsentModuleOptions> = {}): DynamicModule {
    return ConsentModule.forRoot(options);
  }
}
