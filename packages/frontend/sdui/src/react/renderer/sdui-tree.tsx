/**
 * @file sdui-tree.tsx
 * @module @stackra/sdui/react/renderer
 * @description `<SduiTree>` — the entry point of the recursive renderer.
 */

import type { ISduiNode } from "@stackra/contracts";
import { SduiNodeView } from "./sdui-node-view";
import type { ComponentRegistry } from "@/core/registries/component.registry";

export interface ISduiTreeProps {
  readonly root: ISduiNode;
  readonly registry: ComponentRegistry;
}

/**
 * `<SduiTree>` — recursively renders the root node's subtree.
 */
export function SduiTree({ root, registry }: ISduiTreeProps) {
  return <SduiNodeView node={root} registry={registry} />;
}
