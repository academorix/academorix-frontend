/**
 * @file scope-switcher.component.tsx
 * @module @stackra/scope/react/components
 * @description ScopeSwitcher — a HeroUI-based control to switch the active
 *   scope and surface emulation. Built on `@stackra/ui` (HeroUI / HeroUI
 *   Pro).
 *
 *   Uses `ComboBox` (not `Select`) so the scope list is
 *   searchable/filterable — important once the hierarchy grows beyond a
 *   handful of nodes.
 *
 *   Iterates the *node tree* (concrete instances the user can switch to)
 *   — each row's `id` is the value passed to `setScope` / `emulate`.
 *   Compare with `IScopeDefinitionTreeNode` which is the schema of levels
 *   and is NOT what the switcher consumes.
 */

import { useMemo } from "react";
import type { Key } from "react";
import { ComboBox, Input, Label, ListBox, Chip, Button } from "@stackra/ui/react";

import { useScope } from "@/react/hooks/use-scope";
import type { IScopeNodeTreeNode } from "@/core/interfaces";
import type { ScopeSwitcherProps } from "@/react/interfaces";

/** A single flattened row rendered inside the ComboBox. */
interface IFlattenedRow {
  /** Node id — passed to setScope / emulate on selection. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Level slug — used for the search text and (future) group headers. */
  readonly level: string;
  /** Optional secondary description. */
  readonly description?: string;
  /** Indent depth for the visual hierarchy prefix. */
  readonly depth: number;
  /** Whether the row is selectable. */
  readonly disabled: boolean;
}

/**
 * Flatten the node tree into a linear list of indented rows. Preserves
 * DFS order so ancestors always appear immediately before their children.
 */
function flatten(
  nodes: readonly IScopeNodeTreeNode[],
  depth = 0,
  acc: IFlattenedRow[] = [],
): IFlattenedRow[] {
  for (const node of nodes) {
    acc.push({
      id: node.id,
      label: node.label,
      level: node.level,
      description: node.description,
      depth,
      disabled: node.disabled ?? false,
    });
    if (node.children.length) flatten(node.children, depth + 1, acc);
  }
  return acc;
}

/**
 * ScopeSwitcher — search + pick the active scope from the node tree,
 * with an emulation badge + "Exit" affordance when emulating.
 *
 * Options come from `useScope().tree`; selecting one calls `setScope`
 * (or `emulate` when `emulateOnSelect`). Resolution + authorization
 * happen on the backend via the configured data source.
 *
 * @example
 * ```tsx
 * <ScopeSwitcher label="Scope" className="w-64" />
 * <ScopeSwitcher label="View as" emulateOnSelect />
 * ```
 */
export function ScopeSwitcher({
  label = "Scope",
  className,
  emulateOnSelect = false,
}: ScopeSwitcherProps = {}) {
  const { scope, tree, isLoading, isEmulating, setScope, emulate, restore } = useScope();

  const options = useMemo(() => flatten(tree), [tree]);

  const onSelectionChange = (key: Key | null): void => {
    // Empty selection is a HeroUI edge case (typed input with no match)
    // — a no-op is the right behaviour; the current scope stays as-is.
    if (key == null) return;
    const id = String(key);
    void (emulateOnSelect ? emulate(id) : setScope(id));
  };

  return (
    <div className={className} data-scope-switcher>
      <ComboBox
        selectedKey={scope?.nodeId ?? null}
        onSelectionChange={onSelectionChange}
        isDisabled={isLoading}
        menuTrigger="focus"
      >
        <Label>{label}</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search scope..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>
            {options.map((opt) => (
              <ListBox.Item
                key={opt.id}
                id={opt.id}
                textValue={opt.label}
                isDisabled={opt.disabled}
              >
                {/* Non-breaking em-dash indent — flat list, no nested UL. */}
                {"\u2014 ".repeat(opt.depth)}
                {opt.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {isEmulating ? (
        <div className="mt-2 flex items-center gap-2" role="status" aria-live="polite">
          <Chip color="warning" variant="soft" size="sm">
            Emulating
          </Chip>
          <Button size="sm" variant="ghost" onPress={() => restore()}>
            Exit
          </Button>
        </div>
      ) : null}
    </div>
  );
}
