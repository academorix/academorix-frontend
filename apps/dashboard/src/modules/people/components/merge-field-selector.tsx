/**
 * @file merge-field-selector.tsx
 * @module modules/people/components/merge-field-selector
 *
 * @description
 * The field-by-field "which value wins" selector used on the merge page.
 * The parent owns the {@link MergeSelection} state via
 * {@link mergeSelectionReducer} — this component is a pure display node
 * that renders one row per mergeable field and delegates every write back
 * through {@link MergeSelectorProps.onChange}.
 */

import { CheckIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Card } from "@stackra/ui/react";

import type { Person } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { EMPTY_PLACEHOLDER } from "@/modules/people/people.config";

/**
 * Which of the two people wins the value for a single mergeable field. In
 * the merge UI, `"source"` is the left-hand (being merged FROM) record and
 * `"target"` is the right-hand (being merged INTO) record.
 */
export type MergeSide = "source" | "target";

/** The set of scalar fields the merge selector operates on. */
export const MERGEABLE_FIELDS = [
  "full_name",
  "primary_email",
  "primary_phone",
  "avatar_url",
  "dob",
  "gender",
  "nationality",
] as const;

/** A single field name the merge selector recognises. */
export type MergeableField = (typeof MERGEABLE_FIELDS)[number];

/** Human-readable labels for {@link MergeableField}. */
export const MERGEABLE_FIELD_LABELS: Record<MergeableField, string> = {
  full_name: "Full name",
  primary_email: "Primary email",
  primary_phone: "Primary phone",
  avatar_url: "Avatar",
  dob: "Date of birth",
  gender: "Gender",
  nationality: "Nationality",
};

/**
 * Which side wins for every scalar field. The parent starts with the target
 * winning everything (a safe default — nothing is overwritten unless the
 * operator explicitly picks the source) and then flips individual fields
 * via {@link mergeSelectionReducer}.
 */
export type MergeSelection = Record<MergeableField, MergeSide>;

/** Actions understood by {@link mergeSelectionReducer}. */
export type MergeSelectionAction =
  | { type: "pick"; field: MergeableField; side: MergeSide }
  | { type: "pickAll"; side: MergeSide }
  | { type: "reset" };

/** Initial state — the target wins every field unless the operator overrides. */
export const INITIAL_MERGE_SELECTION: MergeSelection = MERGEABLE_FIELDS.reduce(
  (accumulator, field) => {
    accumulator[field] = "target";

    return accumulator;
  },
  {} as MergeSelection,
);

/**
 * Pure reducer for the merge-selection state. Kept side-effect free so the
 * merge page can call it inline via `useReducer` and the unit test can
 * exercise every branch without React.
 *
 * @param state - The current selection.
 * @param action - The action to apply.
 * @returns The next selection (or the same reference when unchanged).
 */
export function mergeSelectionReducer(
  state: MergeSelection,
  action: MergeSelectionAction,
): MergeSelection {
  switch (action.type) {
    case "pick": {
      // Fast-path: nothing changed → return the same reference so React skips
      // the extra render.
      if (state[action.field] === action.side) {
        return state;
      }

      return { ...state, [action.field]: action.side };
    }

    case "pickAll": {
      return MERGEABLE_FIELDS.reduce((accumulator, field) => {
        accumulator[field] = action.side;

        return accumulator;
      }, {} as MergeSelection);
    }

    case "reset": {
      return INITIAL_MERGE_SELECTION;
    }

    default: {
      // Exhaustiveness — TypeScript will error if a new action shape is
      // added without a case above.
      const exhaustiveCheck: never = action;

      return exhaustiveCheck;
    }
  }
}

/**
 * Extracts the scalar value for a mergeable field, coalescing arrays and
 * nulls into a display-friendly string. Used to render the picker row.
 */
function formatFieldValue(person: Person | undefined, field: MergeableField): string {
  if (!person) {
    return EMPTY_PLACEHOLDER;
  }

  const value = person[field];

  if (value === null || value === undefined || value === "") {
    return EMPTY_PLACEHOLDER;
  }

  return String(value);
}

/** Props for {@link MergeFieldSelector}. */
export interface MergeSelectorProps {
  /** The record being merged FROM (left column). */
  source: Person | undefined;
  /** The record being merged INTO (right column, wins by default). */
  target: Person | undefined;
  /** Current per-field selection. */
  selection: MergeSelection;
  /** Called with the next selection when the operator picks a side. */
  onChange: (next: MergeSelection) => void;
}

/**
 * Renders one row per mergeable scalar field. Each row shows the source
 * value, the target value, and two "pick" buttons — the winning side is
 * marked with a check glyph and disabled to make it unambiguous.
 *
 * @param props - Source, target, current selection, and the change handler.
 */
export function MergeFieldSelector({
  source,
  target,
  selection,
  onChange,
}: MergeSelectorProps): ReactNode {
  const pick = (field: MergeableField, side: MergeSide): void => {
    onChange(mergeSelectionReducer(selection, { type: "pick", field, side }));
  };

  const pickAll = (side: MergeSide): void => {
    onChange(mergeSelectionReducer(selection, { type: "pickAll", side }));
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Pick winning values</Card.Title>
        <Card.Description>
          The target record wins by default. Flip individual fields to keep the source value.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onPress={() => pickAll("target")}>
            Keep all target
          </Button>
          <Button size="sm" variant="ghost" onPress={() => pickAll("source")}>
            Keep all source
          </Button>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-xs tracking-wide text-muted uppercase">
              <th className="py-2 pe-4 text-start font-medium">Field</th>
              <th className="py-2 pe-4 text-start font-medium">Source</th>
              <th className="py-2 pe-4 text-start font-medium">Target</th>
              <th className="py-2 text-end font-medium">Winner</th>
            </tr>
          </thead>
          <tbody>
            {MERGEABLE_FIELDS.map((field) => {
              const winner = selection[field];
              const sourceValue = formatFieldValue(source, field);
              const targetValue = formatFieldValue(target, field);

              return (
                <tr key={field} className="border-t border-border">
                  <td className="py-2 pe-4 font-medium text-foreground">
                    {MERGEABLE_FIELD_LABELS[field]}
                  </td>
                  <td className="py-2 pe-4 text-foreground">{sourceValue}</td>
                  <td className="py-2 pe-4 text-foreground">{targetValue}</td>
                  <td className="py-2 text-end">
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Keep source value for ${MERGEABLE_FIELD_LABELS[field]}`}
                        isDisabled={winner === "source"}
                        size="sm"
                        variant={winner === "source" ? "secondary" : "ghost"}
                        onPress={() => pick(field, "source")}
                      >
                        {winner === "source" ? (
                          <CheckIcon aria-hidden="true" className="size-3" />
                        ) : null}
                        Source
                      </Button>
                      <Button
                        aria-label={`Keep target value for ${MERGEABLE_FIELD_LABELS[field]}`}
                        isDisabled={winner === "target"}
                        size="sm"
                        variant={winner === "target" ? "secondary" : "ghost"}
                        onPress={() => pick(field, "target")}
                      >
                        {winner === "target" ? (
                          <CheckIcon aria-hidden="true" className="size-3" />
                        ) : null}
                        Target
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card.Content>
    </Card>
  );
}
