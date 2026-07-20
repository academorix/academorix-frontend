/**
 * @file index.ts
 * @module @stackra/scope/react
 * @description React (web) bindings for the client scope runtime — hooks
 *   backed by the DI `ScopeService` and a HeroUI-based `<ScopeSwitcher>`.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Hooks
// ════════════════════════════════════════════════════════════════════════════════
export { useScope, useScopeTree, useScopeValue } from "./hooks";
export type { UseScopeResult } from "./hooks";

// ════════════════════════════════════════════════════════════════════════════════
// Components
// ════════════════════════════════════════════════════════════════════════════════
export { ScopeSwitcher } from "./components";
export type { ScopeSwitcherProps } from "./components";

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contributions — wired into `DevtoolsModule` by `ScopeModule.forRoot`.
// ════════════════════════════════════════════════════════════════════════════════
export {
  ScopeDevtoolsPanel,
  ScopeInspectorSource,
  ScopeDevtoolsPanelView,
  type ScopeDevtoolsPanelViewProps,
} from "./devtools";
