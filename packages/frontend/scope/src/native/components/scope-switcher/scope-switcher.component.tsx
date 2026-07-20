/**
 * @file scope-switcher.component.tsx
 * @module @stackra/scope/native/components
 * @description NativeScopeSwitcher — React Native scope picker built on
 *   HeroUI Native's `Select` compound (via `@stackra/ui/native`).
 *
 *   Mobile UX reality: no `ComboBox` exists on native, and typing to
 *   filter isn't the primary interaction on a phone — a bottom-sheet
 *   picker is. The switcher iterates the flattened node tree and calls
 *   `setScope(node.id)` (or `emulate(node.id)`) exactly like the web
 *   equivalent, plus a `Chip` + `Button` for the emulation affordance.
 *
 *   Note (per workspace ui-components rule): the "always prefer ComboBox
 *   over Select" rule is web-primary; on HeroUI Native, `Select` IS the
 *   canonical picker.
 */

import { useMemo } from "react";
import { View } from "react-native";
import { Select, Chip, Button, Text } from "@stackra/ui/native";

/**
 * Shape HeroUI Native's `Select` uses for its controlled `value` and
 * `onValueChange`. Declared locally because HeroUI Native does not
 * (yet) export the type publicly.
 */
interface ISelectOption {
  readonly value: string;
  readonly label: string;
}

import { useScope } from "@/react/hooks/use-scope.hook";
import type { IScopeNodeTreeNode } from "@/core/interfaces";
import type { NativeScopeSwitcherProps } from "@/native/interfaces";

/** A single flattened row rendered inside the Select. */
interface IFlattenedRow {
  /** Node id — passed to setScope / emulate on selection. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Optional description shown beneath the label. */
  readonly description?: string;
  /** Indent depth (for the visual hierarchy prefix). */
  readonly depth: number;
  /** Whether the row is selectable. */
  readonly disabled: boolean;
}

/**
 * Flatten the node tree into a linear list of indented rows.
 *
 * DFS order — ancestors always appear immediately before their children,
 * matching how the web `<ScopeSwitcher>` presents the same tree.
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
      description: node.description,
      depth,
      disabled: node.disabled ?? false,
    });
    if (node.children.length) flatten(node.children, depth + 1, acc);
  }
  return acc;
}

/**
 * NativeScopeSwitcher — HeroUI Native `Select`-based picker with an
 * emulation badge + Exit affordance when emulating.
 *
 * Options come from `useScope().tree`; selecting one calls `setScope`
 * (or `emulate` when `emulateOnSelect`). Resolution + authorization
 * happen on the backend via the configured data source.
 *
 * @example
 * ```tsx
 * <NativeScopeSwitcher label="Scope" />
 * <NativeScopeSwitcher label="View as" emulateOnSelect />
 * ```
 */
export function NativeScopeSwitcher({
  label = "Scope",
  placeholder = "Select a scope...",
  className,
  emulateOnSelect = false,
  presentation = "bottom-sheet",
}: NativeScopeSwitcherProps = {}) {
  const { scope, tree, isLoading, isEmulating, setScope, emulate, restore } = useScope();

  const options = useMemo(() => flatten(tree), [tree]);

  // The active option — HeroUI Native's Select is controlled via
  // `{ value, label }`, not a scalar. Rebuild it from the active
  // scope's node id + the row we know it matches.
  const activeOption = useMemo<ISelectOption | undefined>(() => {
    if (!scope?.nodeId) return undefined;
    const row = options.find((opt) => opt.id === scope.nodeId);
    return row ? { value: row.id, label: row.label } : undefined;
  }, [options, scope?.nodeId]);

  const onValueChange = (next: ISelectOption | undefined): void => {
    // HeroUI Native's Select passes a single option (or `undefined` on
    // deselect) to `onValueChange`; guard both shapes defensively.
    if (!next) return;
    const value = next.value;
    void (emulateOnSelect ? emulate(value) : setScope(value));
  };

  return (
    <View className={className}>
      {/*
        Uniwind layout only — HeroUI Native owns every visual style on
        the compound parts. See the ui-components workspace rule.
      */}
      <Select
        value={activeOption}
        onValueChange={onValueChange}
        isDisabled={isLoading}
        presentation={presentation}
      >
        <Select.Trigger>
          <Select.Value placeholder={placeholder} />
          <Select.TriggerIndicator />
        </Select.Trigger>

        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation={presentation}>
            <Select.ListLabel>{label}</Select.ListLabel>
            {options.map((opt) => (
              <Select.Item key={opt.id} value={opt.id} label={opt.label} disabled={opt.disabled}>
                <View className="flex-1 flex-row items-center">
                  {/*
                    Depth prefix — one em-dash per level. Native has no
                    nested list primitive that fits inside a Select,
                    so we render the depth inline (matches the web
                    switcher's affordance verbatim).
                  */}
                  {opt.depth > 0 ? (
                    <Text className="text-muted-foreground mr-2">
                      {"\u2014 ".repeat(opt.depth)}
                    </Text>
                  ) : null}
                  <View className="flex-1">
                    <Select.ItemLabel />
                    {opt.description ? (
                      <Select.ItemDescription>{opt.description}</Select.ItemDescription>
                    ) : null}
                  </View>
                </View>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Portal>
      </Select>

      {isEmulating ? (
        <View
          className="mt-2 flex-row items-center gap-2"
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          <Chip size="sm" variant="soft" color="warning">
            <Chip.Label>Emulating</Chip.Label>
          </Chip>
          <Button size="sm" variant="ghost" onPress={() => restore()}>
            <Button.Label>Exit</Button.Label>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
