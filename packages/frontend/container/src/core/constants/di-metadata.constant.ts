/**
 * @file di-metadata.constant.ts
 * @module @stackra/container/core/constants
 * @description Reflection metadata keys read and written by the DI
 *   decorators (`@Module`, `@Injectable`, `@Inject`, `@Optional`).
 *   These strings form the contract between decorators (writers) and
 *   the injector / scanner (readers).
 */
export const MODULE_METADATA = {
  IMPORTS: "imports",
  PROVIDERS: "providers",
  CONTROLLERS: "controllers",
  EXPORTS: "exports",
};

export const GLOBAL_MODULE_METADATA = "__module:global__";
export const OPTIONAL_DEPS_METADATA = "optional:paramtypes";
export const OPTIONAL_PROPERTY_DEPS_METADATA = "optional:properties_metadata";
export const SCOPE_OPTIONS_METADATA = "scope:options";

export const INJECTABLE_WATERMARK = "__injectable__";

/** TypeScript-emitted constructor parameter types. */
export const PARAMTYPES_METADATA = "design:paramtypes";

/** Explicitly declared dependencies via @Inject(). */
export const SELF_DECLARED_DEPS_METADATA = "self:paramtypes";

/** Property-injected dependencies via @Inject() on properties. */
export const PROPERTY_DEPS_METADATA = "self:properties_metadata";
