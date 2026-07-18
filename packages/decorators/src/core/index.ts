/**
 * @file index.ts
 * @module @stackra/decorators/core
 *
 * @description
 * Public API barrel for the decorator factories.
 *
 * Import from `@stackra/decorators/core` when building a new domain
 * decorator. For consuming an existing domain decorator, import from
 * the domain barrel directly (e.g. `@stackra/decorators/devtools`).
 */

export { createDiscoverableClassDecorator } from "./create-discoverable-class-decorator.util";
export type { ICreateDiscoverableClassDecoratorOverrides } from "./create-discoverable-class-decorator.util";

export { createMetadataClassDecorator } from "./create-metadata-class-decorator.util";
export type { ICreateMetadataClassDecoratorOverrides } from "./create-metadata-class-decorator.util";

export { createDiscoverableMethodDecorator } from "./create-discoverable-method-decorator.util";
export type { ICreateDiscoverableMethodDecoratorOverrides } from "./create-discoverable-method-decorator.util";

export { createMapAccumulatorPropertyDecorator } from "./create-map-accumulator-property-decorator.util";
export type { ICreateMapAccumulatorPropertyDecoratorOverrides } from "./create-map-accumulator-property-decorator.util";

export { createMetadataReader } from "./create-metadata-reader.util";
export type { IMetadataReader } from "./create-metadata-reader.util";

export { assertClassIsInjectable } from "./assert-class-is-injectable.util";
