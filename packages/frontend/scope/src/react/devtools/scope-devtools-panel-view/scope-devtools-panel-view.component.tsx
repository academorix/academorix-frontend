/**
 * @file scope-devtools-panel-view.component.tsx
 * @module @stackra/scope/react/devtools
 * @description React body of the `@stackra/devtools` scope panel.
 *
 *   Renders the active scope context (level / entity / owner / path)
 *   and the switchable scope tree as a nested, read-only list inside
 *   a HeroUI Pro `Card`. Subscribes to the {@link ScopeService}'s
 *   snapshot via `useSyncExternalStore` — the service's `subscribe`
 *   / `getSnapshot` contract guarantees a stable identity between
 *   emits, which is what `useSyncExternalStore` requires to stay
 *   tearing-free under concurrent React.
 *
 *   The tree is rendered as a nested `<ul>` structure rather than
 *   HeroUI Pro's `FileTree` — the visual weight of a full
 *   drag/drop/keyboard-nav tree is unnecessary in a read-only
 *   devtools panel, and the simpler markup matches the SSR + cache
 *   panels for consistency. Swap in `FileTree` if / when hierarchy
 *   grows beyond two levels of meaningful depth.
 */

import { type ReactElement, useCallback, useSyncExternalStore } from "react";
import { Card, Chip } from "@stackra/ui/react";

import type { IScopeNodeTreeNode, IScopeSnapshot } from "@/core/interfaces";
import type { ScopeService } from "@/core/services/scope.service";
import type { ScopeDevtoolsPanelViewProps } from "./scope-devtools-panel-view.interface";

/**
 * Empty snapshot used when the service is absent. Referentially
 * stable so `useSyncExternalStore` sees a consistent identity across
 * renders when we're on the "no scope module" branch.
 */
const EMPTY_SNAPSHOT: IScopeSnapshot = Object.freeze({
  scope: null,
  tree: [] as readonly IScopeNodeTreeNode[],
  isLoading: false,
  isEmulating: false,
});

/**
 * Render a single scope tree node + its children as nested list rows.
 *
 * Recursive component — depth is bounded by the backend's tree shape,
 * which is authorised and typically shallow (owner → venue → team).
 * The badge on the active node highlights the current selection.
 */
function TreeNode({
  node,
  activeId,
  depth,
}: {
  node: IScopeNodeTreeNode;
  activeId: string | null;
  depth: number;
}): ReactElement {
  const isActive = node.id === activeId;
  return (
    <li>
      <div
        // Indent by depth — each level adds a subtle offset so the
        // hierarchy is legible without a formal tree component.
        className="flex items-center gap-2 py-1"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <span className="text-foreground text-sm">{node.label}</span>
        <code className="text-muted text-xs">{node.level}</code>
        {isActive ? (
          <Chip size="sm" variant="primary">
            <Chip.Label>active</Chip.Label>
          </Chip>
        ) : null}
        {node.disabled ? (
          <Chip size="sm" variant="secondary">
            <Chip.Label>disabled</Chip.Label>
          </Chip>
        ) : null}
      </div>
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} activeId={activeId} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * The scope devtools panel body.
 *
 * @param props - See {@link ScopeDevtoolsPanelViewProps}.
 * @returns The panel body — active scope context + switchable tree.
 */
export function ScopeDevtoolsPanelView({ service }: ScopeDevtoolsPanelViewProps): ReactElement {
  // `useSyncExternalStore` needs stable subscribe / getSnapshot
  // callbacks. When the service is absent (feature-only devtools
  // consumer, or lazily-loaded scope module) we short-circuit to a
  // frozen empty snapshot so the hook doesn't tear on re-renders.
  const subscribe = useCallback(
    (cb: () => void) => (service ? service.subscribe(cb) : () => {}),
    [service],
  );
  const getSnapshot = useCallback(
    () => (service ? service.getSnapshot() : EMPTY_SNAPSHOT),
    [service],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!service) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>Scope service not available</Card.Title>
            <Card.Description>
              Wire <code>ScopeModule.forRoot(...)</code> to see the active scope + tree here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  const { scope, tree, isLoading, isEmulating } = snapshot;
  const activeId = scope?.nodeId ?? null;

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-foreground text-base font-semibold">Scope</h3>
        <p className="text-muted text-xs">
          Live active scope context and the switch-target node tree.
        </p>
      </header>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Card.Title className="text-sm">Active scope</Card.Title>
            {isEmulating ? (
              <Chip size="sm" variant="secondary">
                <Chip.Label>emulating</Chip.Label>
              </Chip>
            ) : null}
            {isLoading ? (
              <Chip size="sm" variant="secondary">
                <Chip.Label>loading</Chip.Label>
              </Chip>
            ) : null}
          </div>
          <Card.Description>
            {scope ? `Currently at ${scope.level}: ${scope.entityId}` : "No scope resolved yet."}
          </Card.Description>
        </Card.Header>
        {scope ? (
          <Card.Content>
            <ul className="flex flex-col gap-1 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted">Owner</span>
                <code className="tabular-nums">{scope.ownerId}</code>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Node</span>
                <code className="tabular-nums">{scope.nodeId}</code>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Level</span>
                <code className="tabular-nums">{scope.level}</code>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Entity</span>
                <code className="tabular-nums">{scope.entityId}</code>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Path depth</span>
                <span className="tabular-nums">{scope.path.length}</span>
              </li>
            </ul>
          </Card.Content>
        ) : null}
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm">Switchable tree</Card.Title>
          <Card.Description>
            {tree.length === 0
              ? "The scope tree is empty. Load it via the data source."
              : `${tree.length} root node${tree.length === 1 ? "" : "s"}, authorised backend-side.`}
          </Card.Description>
        </Card.Header>
        {tree.length > 0 ? (
          <Card.Content>
            <ul className="flex flex-col">
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} activeId={activeId} depth={0} />
              ))}
            </ul>
          </Card.Content>
        ) : null}
      </Card>
    </div>
  );
}
