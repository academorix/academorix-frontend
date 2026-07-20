/**
 * @file sdui-node-view.tsx
 * @module @stackra/sdui/react/renderer
 * @description `<SduiNodeView>` — the recursive renderer.
 *
 *   For each `ISduiNode`:
 *   1. Evaluates `visibleIf` — bails when falsy.
 *   2. Resolves the component entry via the registry.
 *   3. Merges static `props` with expression-resolved `bindings`.
 *   4. Wires `actions` through the SDUI action adapter, mapping each
 *      logical event (`onPress`, `onSubmit`, ...) to the underlying
 *      component's event prop (identity mapping unless the registry
 *      entry overrides `events`).
 *   5. Recurses into named slots (all slots concatenated into
 *      `children` unless the entry declares `acceptsChildren: false`).
 *   6. Wraps every node in a `<NodeErrorBoundary>`.
 */

import { createElement, useCallback, type ReactNode } from "react";
import { Alert } from "@stackra/ui/react";
import type { ISduiAction, ISduiNode } from "@stackra/contracts";
import { evaluateBoolean, resolveBindable } from "@/core/expression/evaluator";
import type { ComponentRegistry } from "@/core/registries/component.registry";
import { useSduiRuntime } from "../providers/sdui-runtime.provider";
import { useSduiActionAdapter } from "../action-adapter/action-adapter";
import { NodeErrorBoundary } from "./node-error-boundary";

/**
 * Props for {@link SduiNodeView}.
 */
export interface ISduiNodeViewProps {
  /** The node to render. */
  readonly node: ISduiNode;
  /** Component registry the renderer resolves `type` against. */
  readonly registry: ComponentRegistry;
}

/**
 * `<SduiNodeView>` — renders a single SDUI node (and its slots).
 */
export function SduiNodeView({ node, registry }: ISduiNodeViewProps) {
  const runtime = useSduiRuntime();
  const dispatch = useSduiActionAdapter();

  // Visibility guard — evaluated against the current scope.
  const visibilityCallback = useCallback(() => {
    if (!node.visibleIf) return true;
    return evaluateBoolean(node.visibleIf, runtime.scope);
  }, [node.visibleIf, runtime.scope]);
  if (!visibilityCallback()) return null;

  const entry = registry.resolve(node.type);
  if (!entry) return <UnknownComponentDiagnostic node={node} />;

  // Static props + resolved bindings (bindings win on collision).
  const staticProps = node.props ?? {};
  const boundProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node.bindings ?? {})) {
    boundProps[key] = resolveBindable(value, runtime.scope);
  }
  const props: Record<string, unknown> = { ...staticProps, ...boundProps };

  // Wire action lists onto the underlying component's event props.
  if (node.actions) {
    for (const [eventName, actions] of Object.entries(node.actions)) {
      const targetProp = entry.events?.[eventName as never] ?? eventName;
      const list = actions ?? [];
      props[targetProp] = () => runSequence(list, dispatch);
    }
  }

  // Class + leaf-value passthroughs.
  if (node.className && !("className" in props)) props.className = node.className;
  if (node.value !== undefined && !("value" in props)) props.value = node.value;
  // Runtime always sets a stable key.
  const finalProps: Record<string, unknown> = {
    ...(entry.mapProps ? entry.mapProps(props) : props),
    key: node.id,
  };

  // Slot recursion.
  const children: ReactNode[] =
    entry.acceptsChildren === false
      ? []
      : collectChildren(node).map((child) => (
          <SduiNodeView key={child.id} node={child} registry={registry} />
        ));

  const element =
    children.length > 0
      ? createElement(entry.component as never, finalProps, ...children)
      : createElement(entry.component as never, finalProps);

  return (
    <NodeErrorBoundary nodeId={node.id} nodeType={node.type}>
      {element}
    </NodeErrorBoundary>
  );
}

/**
 * Flatten every named slot's children into a single ordered array,
 * preserving slot order (Object.entries insertion order).
 */
function collectChildren(node: ISduiNode): readonly ISduiNode[] {
  if (!node.slots) return [];
  const out: ISduiNode[] = [];
  for (const value of Object.values(node.slots)) {
    if (Array.isArray(value)) out.push(...value);
  }
  return out;
}

/**
 * Dispatch every action in `list` sequentially, awaiting each so
 * responses can be observed by the adapter (which forwards
 * notifications + emits `SDUI_EVENTS.ACTION_DISPATCHED`).
 *
 * `runSequence` still returns `void` because it's plumbed onto DOM
 * event handlers that don't await — but the underlying `for … await`
 * ensures every dispatch runs *and* completes before the next one
 * starts. That matters for composed schemas where an earlier `mutate`
 * mutates state that a later `navigate` reads.
 */
function runSequence(
  list: readonly ISduiAction[],
  dispatch: (action: ISduiAction) => Promise<unknown>,
): void {
  // Fire-and-forget from the DOM handler's perspective; each iteration
  // awaits so the sequence is truly ordered.
  void (async () => {
    for (const action of list) {
      // eslint-disable-next-line no-await-in-loop
      await dispatch(action);
    }
  })();
}

/**
 * Fallback rendered when no component is registered for `node.type`.
 * Uses HeroUI `<Alert>` for the diagnostic — no bespoke Tailwind color
 * tokens on plain elements (per the ui-components workspace rule).
 */
function UnknownComponentDiagnostic({ node }: { node: ISduiNode }) {
  return (
    <Alert status="warning" role="alert">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Unknown SDUI component &ldquo;{node.type}&rdquo;</Alert.Title>
        <Alert.Description>
          No component is registered for node &ldquo;{node.id}&rdquo;. Register it via{" "}
          <code>SduiModule.forFeature</code>.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
