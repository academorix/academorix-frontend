/**
 * @file index.ts
 * @module @stackra/sdui/react
 * @description React bindings for `@stackra/sdui` — the runtime provider,
 *   theme scope, node error boundary, recursive renderer, action adapter,
 *   hooks, wired `<SduiScreenView>`, and the web-side module that seeds
 *   the component / layout registries.
 */

// Module (web)
export { WebSduiModule } from "./web-sdui.module";

// Providers — `ISduiRuntime` + `ISduiNotification` are contract types
// (import from `@stackra/contracts` directly, per `contract-reexports.md`).
export {
  SduiRuntimeProvider,
  useSduiRuntime,
  SduiThemeScope,
  type ISduiRuntimeProviderProps,
  type ISduiThemeScopeProps,
} from "./providers";

// Renderer
export {
  NodeErrorBoundary,
  SduiNodeView,
  SduiTree,
  type INodeErrorBoundaryProps,
  type ISduiNodeViewProps,
  type ISduiTreeProps,
} from "./renderer";

// Action adapter
export { useSduiActionAdapter } from "./action-adapter";

// Hooks
export {
  useSchema,
  useSduiComponent,
  useSduiPage,
  useDataSources,
  type IUseSchemaResult,
  type IUseDataSourcesResult,
} from "./hooks";

// Top-level view
export { SduiScreenView, type ISduiScreenViewProps } from "./components";

// Registry seeds (consumers can call these directly against a bespoke registry)
export {
  registerCorePrimitives,
  registerHeroUiComponents,
  registerBuiltInLayouts,
} from "./registry";
