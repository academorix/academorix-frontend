/**
 * @file sdui-registry.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Component + layout registry entry shapes.
 */

import type { SduiInteractionEvent } from "./sdui-node.interface";

/**
 * A registered SDUI component.
 *
 * The registry is a `Map<string, ISduiComponentEntry>` keyed by node
 * `type` string (dotted keys allowed — e.g. `'Card.Header'`).
 */
export interface ISduiComponentEntry {
  /** The React component that renders the node. */
  readonly component: unknown;

  /**
   * Optional event-name mapping — logical SDUI event → underlying prop
   * name. Defaults to identity (e.g. `onPress` → `onPress`).
   */
  readonly events?: Readonly<Partial<Record<SduiInteractionEvent, string>>>;

  /**
   * Optional prop adapter — the renderer runs this on the resolved
   * prop bag before passing it to the component. Useful for coercing
   * schema strings into React elements (icon names → `<Icon>`) or for
   * synthesizing derived props.
   */
  readonly mapProps?: (props: Record<string, unknown>) => Record<string, unknown>;

  /** When `false`, the renderer skips slot recursion. Defaults to `true`. */
  readonly acceptsChildren?: boolean;

  /** Optional taxonomy for devtools. */
  readonly category?: string;
}

/**
 * A registered SDUI layout (scene template).
 *
 * `ISduiScreen.layout` matches on `key` — the renderer wraps the
 * screen's root tree in the layout's `component` before rendering.
 */
export interface ISduiLayoutEntry {
  /** Layout registry key (e.g. `'list'`, `'show'`, `'analytics'`). */
  readonly key: string;
  /** The React component that receives the tree in `children`. */
  readonly component: unknown;
}
