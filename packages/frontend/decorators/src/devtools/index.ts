/**
 * @file index.ts
 * @module @stackra/decorators/devtools
 *
 * @description
 * Public API barrel for the devtools domain decorators.
 *
 * Feature packages that ship a devtools panel or inspector source
 * import from here to declare their contribution without pulling in
 * the `@stackra/devtools` runtime — the loader lives in that
 * package but the stamping side lives here.
 */

export { DevtoolsPanel, devtoolsPanelMetadata } from "./devtools-panel.decorator";
export {
  DevtoolsInspectorSource,
  devtoolsInspectorSourceMetadata,
} from "./devtools-inspector-source.decorator";
