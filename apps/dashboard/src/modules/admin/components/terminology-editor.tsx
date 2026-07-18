/**
 * @file terminology-editor.tsx
 * @module modules/admin/components/terminology-editor
 *
 * @description
 * The controlled editor for a tenant's `Identity["terminology"]` overrides —
 * the map that renames domain nouns per tenant (an academy shows "Students"
 * instead of "Athletes", a martial arts school prefers "Instructors" over
 * "Coaches"). Renders a row per canonical resource with a text input for the
 * override; leaving a row blank falls back to the app default at render time.
 *
 * The editor is intentionally offline-friendly: it takes an `initialValues`
 * map, tracks a local draft in `useState`, and hands the trimmed draft back
 * through `onSubmit`. The wiring to a real persistence layer will land with
 * the tenant-settings resource (see `TODO(backend-endpoint)` in the caller).
 */

import { ArrowUturnLeftIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Card, Form, Input, Label, TextField } from "@stackra/ui/react";
import { useMemo, useState } from "react";

import type { TerminologyDraft } from "@/modules/admin/admin.types";
import type { ReactNode } from "react";

/** A single canonical resource whose noun the tenant may override. */
export interface TerminologyRowDescriptor {
  /** Canonical resource key, e.g. `"athletes"`. */
  resource: string;
  /** Human label shown alongside the input, e.g. `"Athletes → …"`. */
  label: string;
  /** Placeholder / hint copy shown when the row is empty. */
  placeholder: string;
  /** Short helper text rendered beneath the row. */
  description: string;
}

/**
 * The canonical resource list the editor covers day 1. Kept module-local
 * (not imported from every module's manifest) because the point of the
 * override map is to let a tenant rename Academorix's *domain nouns*, and
 * those nouns are stable across releases. Adding a new row is a two-line
 * change once the tenant asks for it.
 */
export const TERMINOLOGY_ROWS: readonly TerminologyRowDescriptor[] = [
  {
    resource: "athletes",
    label: "Athletes",
    placeholder: "Students, Members, Players",
    description: "The noun for the primary trainee — e.g. Students for an academy.",
  },
  {
    resource: "staff",
    label: "Staff",
    placeholder: "Instructors, Team",
    description: "The noun for internal people — coaches, admins, reception.",
  },
  {
    resource: "coaches",
    label: "Coaches",
    placeholder: "Instructors, Trainers",
    description: "The subset of staff who lead sessions.",
  },
  {
    resource: "teams",
    label: "Teams",
    placeholder: "Squads, Groups",
    description: "The noun for a cohort trained together.",
  },
  {
    resource: "sessions",
    label: "Sessions",
    placeholder: "Classes, Lessons, Practices",
    description: "The noun for a scheduled block of training.",
  },
  {
    resource: "matches",
    label: "Matches",
    placeholder: "Games, Bouts, Events",
    description: "The competitive event the sport calls its own name.",
  },
] as const;

/** Props for {@link TerminologyEditor}. */
export interface TerminologyEditorProps {
  /**
   * The current terminology overrides for the tenant (e.g. from
   * `Identity["terminology"]`). Missing keys render as empty inputs.
   */
  initialValues?: TerminologyDraft;
  /** Whether a save is in flight. */
  isSubmitting?: boolean;
  /**
   * Called with the trimmed draft on submit. Empty values are omitted so the
   * backend does not have to distinguish "explicitly blank" from "unset".
   */
  onSubmit: (draft: TerminologyDraft) => void;
  /** Optional label for the primary submit button. */
  submitLabel?: string;
}

/**
 * Builds the starting state for the local `useState`. We seed every known
 * resource with either the caller's override or an empty string so React's
 * controlled inputs always have a defined value.
 */
function buildInitialDraft(initialValues: TerminologyDraft = {}): TerminologyDraft {
  const draft: TerminologyDraft = {};

  for (const row of TERMINOLOGY_ROWS) {
    draft[row.resource] = initialValues[row.resource] ?? "";
  }

  return draft;
}

/**
 * Returns the draft with every value trimmed and empty rows omitted, so the
 * caller can persist a compact override map ("no entry" wins over "empty
 * string" at read time via the terminology hook fallback).
 *
 * Exported so the caller's tests can assert on the exact payload shape.
 *
 * @param draft - The raw draft state.
 * @returns A compact map of `{ resource → non-empty label }`.
 */
export function toTerminologyPayload(draft: TerminologyDraft): TerminologyDraft {
  const payload: TerminologyDraft = {};

  for (const [resource, value] of Object.entries(draft)) {
    const trimmed = value.trim();

    if (trimmed !== "") {
      payload[resource] = trimmed;
    }
  }

  return payload;
}

/**
 * A controlled tenant terminology editor.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function TerminologyEditor({
  initialValues,
  isSubmitting = false,
  onSubmit,
  submitLabel = "Save terminology",
}: TerminologyEditorProps): ReactNode {
  // Memoise the seeded initial state so a re-render from parent state does
  // not accidentally reset the draft the user is typing into.
  const initialDraft = useMemo(() => buildInitialDraft(initialValues), [initialValues]);
  const [draft, setDraft] = useState<TerminologyDraft>(initialDraft);

  const setField = (resource: string, value: string): void => {
    setDraft((current) => ({ ...current, [resource]: value }));
  };

  const handleReset = (): void => {
    setDraft(initialDraft);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(toTerminologyPayload(draft));
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Terminology overrides</Card.Title>
        <Card.Description>
          Rename how the workspace refers to core nouns. Leave a row blank to keep the default.
        </Card.Description>
      </Card.Header>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TERMINOLOGY_ROWS.map((row) => (
              <TextField
                key={row.resource}
                name={`terminology[${row.resource}]`}
                value={draft[row.resource] ?? ""}
                variant="secondary"
                onChange={(value) => setField(row.resource, value)}
              >
                <Label>{row.label}</Label>
                <Input placeholder={row.placeholder} />
                <p className="mt-1 text-xs text-muted">{row.description}</p>
              </TextField>
            ))}
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end gap-2">
          <Button
            aria-label="Reset terminology to the currently saved values"
            isDisabled={isSubmitting}
            size="sm"
            variant="ghost"
            onPress={handleReset}
          >
            <ArrowUturnLeftIcon aria-hidden="true" className="size-4" />
            Reset
          </Button>
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}
