/**
 * @file scope-select.tsx
 * @module components/scope/scope-select
 *
 * @description
 * Shared presentational control for the organization/branch/season switchers.
 * It renders a compact HeroUI `Select` when there is a real choice, a static
 * read-only indicator when only one option exists (context without a useless
 * dropdown), and nothing when there are no options — satisfying the
 * "never blocking" rule. Permission gating is implicit: the caller's accessible
 * scopes are already filtered server-side in `/auth/me`.
 */

import { Label, ListBox, Select } from "@academorix/ui/react";

import type { IconType } from "@academorix/ui/icons";
import type { Key, ReactNode } from "react";

/** A selectable scope option. */
interface ScopeSelectOption {
  id: string;
  name: string;
}

/** Props for {@link ScopeSelect}. */
interface ScopeSelectProps {
  /** Accessible label for the control (screen readers + `aria-label`). */
  ariaLabel: string;
  /** Leading glyph shown in the static indicator. */
  icon: IconType;
  /** The active option id, or `null` when unresolved. */
  value: string | null;
  /** Available options for this dimension. */
  options: ScopeSelectOption[];
  /** Called with the newly-selected option id. */
  onChange: (id: string) => void;
}

/**
 * Renders a scope dimension as a switcher, a static indicator, or nothing.
 *
 * @param props - Label, icon, active value, options, and change handler.
 */
export function ScopeSelect({
  ariaLabel,
  icon: Icon,
  value,
  options,
  onChange,
}: ScopeSelectProps): ReactNode {
  // No options for this dimension → render nothing (never blocks the shell).
  if (options.length === 0) {
    return null;
  }

  // A single option → show it read-only for context, no interactive dropdown.
  if (options.length === 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 text-sm text-muted" title={ariaLabel}>
        <Icon aria-hidden="true" className="size-4" />
        <span className="max-w-[10rem] truncate">{options[0]!.name}</span>
      </div>
    );
  }

  return (
    <Select
      aria-label={ariaLabel}
      className="w-[11rem]"
      placeholder={ariaLabel}
      value={value}
      variant="secondary"
      onChange={(key: Key | null) => {
        if (key != null) {
          onChange(String(key));
        }
      }}
    >
      <Label className="sr-only">{ariaLabel}</Label>
      <Select.Trigger>
        <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.name}>
              {option.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
