/**
 * @file index.ts
 * @module @stackra/sdui/react/registry
 * @description Public API barrel for the React subpath's `registry`
 *   category — re-exports the primitive / HeroUI / layout registration
 *   helpers consumers wire into `SduiModule.forFeature(...)`.
 */

export { registerCorePrimitives } from "./register-primitives";
export { registerHeroUiComponents } from "./register-heroui";
export { registerBuiltInLayouts } from "./register-layouts";
