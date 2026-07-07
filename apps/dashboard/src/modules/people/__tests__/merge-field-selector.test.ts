/**
 * @file merge-field-selector.test.ts
 * @module modules/people/__tests__/merge-field-selector.test
 *
 * @description
 * Unit tests for the pure {@link mergeSelectionReducer} that powers the
 * merge selector state. Reducer is the heart of the merge screen — every
 * branch is exercised here so the UI can trust the state transitions.
 */

import { describe, expect, it } from "vitest";

import type { MergeSelection } from "@/modules/people/components/merge-field-selector";

import {
  INITIAL_MERGE_SELECTION,
  MERGEABLE_FIELDS,
  mergeSelectionReducer,
} from "@/modules/people/components/merge-field-selector";

describe("mergeSelectionReducer", () => {
  it("initialises every field to the target side", () => {
    for (const field of MERGEABLE_FIELDS) {
      expect(INITIAL_MERGE_SELECTION[field]).toBe("target");
    }
  });

  it("flips a single field to the source side on `pick`", () => {
    const next = mergeSelectionReducer(INITIAL_MERGE_SELECTION, {
      type: "pick",
      field: "primary_email",
      side: "source",
    });

    expect(next.primary_email).toBe("source");
    // Untouched fields must stay on the target side.
    expect(next.full_name).toBe("target");
    expect(next.primary_phone).toBe("target");
  });

  it("returns the same reference when the picked side is already selected", () => {
    // Reducer optimises the no-op case to avoid a wasted React render.
    const next = mergeSelectionReducer(INITIAL_MERGE_SELECTION, {
      type: "pick",
      field: "primary_email",
      side: "target",
    });

    expect(next).toBe(INITIAL_MERGE_SELECTION);
  });

  it("does not mutate the previous state on `pick`", () => {
    const previous = { ...INITIAL_MERGE_SELECTION };

    mergeSelectionReducer(previous, {
      type: "pick",
      field: "primary_email",
      side: "source",
    });

    // The previous reference must remain untouched — reducers are pure.
    expect(previous.primary_email).toBe("target");
  });

  it("switches every field to the source on `pickAll` with side='source'", () => {
    const next = mergeSelectionReducer(INITIAL_MERGE_SELECTION, {
      type: "pickAll",
      side: "source",
    });

    for (const field of MERGEABLE_FIELDS) {
      expect(next[field]).toBe("source");
    }
  });

  it("switches every field back to the target on `pickAll` with side='target'", () => {
    // Start from a fully-source selection so pickAll('target') has work to do.
    const allSource: MergeSelection = MERGEABLE_FIELDS.reduce((accumulator, field) => {
      accumulator[field] = "source";

      return accumulator;
    }, {} as MergeSelection);

    const next = mergeSelectionReducer(allSource, { type: "pickAll", side: "target" });

    for (const field of MERGEABLE_FIELDS) {
      expect(next[field]).toBe("target");
    }
  });

  it("resets the selection to the initial state on `reset`", () => {
    // Start from a partially-flipped selection.
    const mixed = mergeSelectionReducer(INITIAL_MERGE_SELECTION, {
      type: "pick",
      field: "primary_email",
      side: "source",
    });
    const mixed2 = mergeSelectionReducer(mixed, {
      type: "pick",
      field: "full_name",
      side: "source",
    });

    const reset = mergeSelectionReducer(mixed2, { type: "reset" });

    for (const field of MERGEABLE_FIELDS) {
      expect(reset[field]).toBe("target");
    }
  });

  it("supports arbitrary field ordering across successive picks", () => {
    let state = INITIAL_MERGE_SELECTION;

    state = mergeSelectionReducer(state, { type: "pick", field: "dob", side: "source" });
    state = mergeSelectionReducer(state, { type: "pick", field: "gender", side: "source" });
    state = mergeSelectionReducer(state, {
      type: "pick",
      field: "dob",
      side: "target",
    });

    // dob was flipped back to target; gender should still be source.
    expect(state.dob).toBe("target");
    expect(state.gender).toBe("source");
  });
});
