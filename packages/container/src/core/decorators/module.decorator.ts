/**
 * @Module() Decorator
 *
 * Defines a module — the organizational unit of the DI system.
 * Modules group related providers and define the dependency graph
 * between different parts of the application.
 *
 * Structurally identical to NestJS's `@Module()` decorator.
 *
 * @module decorators/module
 */

import { defineMetadata } from "@vivtel/metadata";

import { MODULE_METADATA } from "@/core/constants";
import type { ModuleMetadata } from "@stackra/contracts";

/**
 * Map from accepted property names on `ModuleMetadata` to the canonical
 * metadata key constants from `MODULE_METADATA`.
 */
export const PROPERTY_TO_METADATA_KEY: Record<keyof ModuleMetadata, string> = {
  imports: MODULE_METADATA.IMPORTS,
  controllers: MODULE_METADATA.CONTROLLERS,
  providers: MODULE_METADATA.PROVIDERS,
  exports: MODULE_METADATA.EXPORTS,
};

/**
 * Set of valid property keys on the metadata object passed to `@Module()`.
 */
export const VALID_MODULE_KEYS = new Set(Object.keys(PROPERTY_TO_METADATA_KEY));

/**
 * Defines a module with its imports, providers, controllers, and exports.
 *
 * Validates that only known metadata keys are used, then stores each
 * property under its canonical {@link MODULE_METADATA} constant on the
 * target class. The scanner reads these entries during the module graph
 * traversal.
 *
 * @param metadata - Module configuration specifying imports, providers, controllers, and exports.
 * @returns A `ClassDecorator` that stores the module metadata on the target class
 *
 * @throws Error if any unknown property keys are passed in the metadata object
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [ConfigModule.forRoot(config)],
 *   providers: [UserService, UserRepository],
 *   exports: [UserService],
 * })
 * class UserModule {}
 * ```
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  const invalidKeys = Object.keys(metadata).filter((key) => !VALID_MODULE_KEYS.has(key));
  if (invalidKeys.length > 0) {
    throw new Error(
      `Invalid property '${invalidKeys.join("', '")}' passed into the @Module() decorator. ` +
        `Valid properties are: ${[...VALID_MODULE_KEYS].join(", ")}.`,
    );
  }

  return (target: object) => {
    for (const property in metadata) {
      if (!Object.prototype.hasOwnProperty.call(metadata, property)) continue;

      const metadataKey = PROPERTY_TO_METADATA_KEY[property as keyof ModuleMetadata];
      defineMetadata(metadataKey, (metadata as Record<string, unknown>)[property], target);
    }
  };
}
