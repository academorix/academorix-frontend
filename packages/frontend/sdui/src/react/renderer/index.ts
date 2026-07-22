/**
 * @file index.ts
 * @module @stackra/sdui/react/renderer
 * @description Public API barrel for the React subpath's `renderer`
 *   category — re-exports the per-node error boundary, the single-node
 *   view, and the recursive tree view components together with their
 *   props interfaces.
 */

export { NodeErrorBoundary, type INodeErrorBoundaryProps } from "./node-error-boundary";
export { SduiNodeView, type ISduiNodeViewProps } from "./sdui-node-view";
export { SduiTree, type ISduiTreeProps } from "./sdui-tree";
