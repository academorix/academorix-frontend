/**
 * @file merge.tsx
 * @module modules/people/pages/merge
 *
 * @description
 * Platform-admin merge / dedup UI — reconciles two `Person` records into
 * one. The left panel is the source (being merged FROM), the right is the
 * target (being merged INTO). A field-by-field selector picks which value
 * wins for each scalar field, then a confirm dialog fires the write.
 *
 * TODO(backend-endpoint): `POST /api/v1/people/merge`. Until the backend
 * ships, the confirm dialog surfaces a toast + debug log explaining the
 * endpoint is missing — no state changes hit the wire on 403/404/501, so
 * this screen is safe to leave live in the meantime.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.17 (dedup is a platform-admin op)
 */

import {
  AlertDialog,
  Button,
  Card,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@stackra/ui/react";
import { useOne } from "@refinedev/core";
import { useCallback, useReducer, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "@stackra/routing/react";

import type {
  MergeableField,
  MergeSelection,
} from "@/modules/people/components/merge-field-selector";
import type { Person } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { httpClient } from "@/lib/http";
import {
  INITIAL_MERGE_SELECTION,
  MERGEABLE_FIELDS,
  MergeFieldSelector,
  mergeSelectionReducer,
} from "@/modules/people/components/merge-field-selector";
import { PersonHeader } from "@/modules/people/components/person-header";

/** HTTP statuses treated as "backend endpoint not shipped yet". */
const BACKEND_GAP_STATUSES = new Set<number>([403, 404, 501]);

/**
 * Builds the payload the merge endpoint expects — an explicit map of every
 * scalar field to the winning value.
 */
function buildMergedFields(
  source: Person,
  target: Person,
  selection: MergeSelection,
): Record<MergeableField, unknown> {
  return MERGEABLE_FIELDS.reduce(
    (accumulator, field) => {
      accumulator[field] = selection[field] === "source" ? source[field] : target[field];

      return accumulator;
    },
    {} as Record<MergeableField, unknown>,
  );
}

/** Small hook that fetches a `Person` by id from the `people` resource. */
function usePersonById(id: string | null | undefined): {
  person: Person | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const { result, query } = useOne<Person>({
    resource: "people",
    id: id ?? "",
    queryOptions: { enabled: Boolean(id) },
  });

  return {
    person: id ? result : undefined,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/** Extracts an HTTP status code from a variety of error shapes. */
function statusCodeOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const record = error as { statusCode?: unknown; status?: unknown };

  if (typeof record.statusCode === "number") {
    return record.statusCode;
  }

  if (typeof record.status === "number") {
    return record.status;
  }

  return undefined;
}

/** The people merge / dedup screen. */
export default function PeopleMerge(): ReactNode {
  const { id: targetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const sourceId = searchParams.get("source");

  const [sourceIdInput, setSourceIdInput] = useState(sourceId ?? "");
  const [note, setNote] = useState("");
  const [selection, dispatch] = useReducer(mergeSelectionReducer, INITIAL_MERGE_SELECTION);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const target = usePersonById(targetId);
  const source = usePersonById(sourceId);

  /** Handles the "Load source" button — pushes the id into the URL. */
  const loadSource = useCallback(() => {
    const trimmed = sourceIdInput.trim();

    if (!trimmed) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("source", trimmed);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, sourceIdInput]);

  /** Fires the merge write. Graceful on 403/404/501 — toast + debug log. */
  const commitMerge = useCallback(async (): Promise<void> => {
    if (!source.person || !target.person) {
      return;
    }

    setIsMerging(true);

    const payload: Record<string, unknown> = {
      source_id: source.person.id,
      target_id: target.person.id,
      merged_fields: buildMergedFields(source.person, target.person, selection),
      note: note.trim() || null,
    };

    try {
      // TODO(backend-endpoint): POST /api/v1/people/merge — the endpoint
      // does not exist yet. Backend should return 200 with `{ id }` of the
      // surviving Person on success.
      await httpClient.post("/people/merge", payload);

      toast.success("People merged", {
        description: `${source.person.full_name} was merged into ${target.person.full_name}.`,
      });

      setConfirmOpen(false);
      navigate(`/people/${target.person.id}`);
    } catch (error) {
      const status = statusCodeOf(error);

      // eslint-disable-next-line no-console
      console.debug("[people] POST /api/v1/people/merge failed — TODO(backend-endpoint)", {
        status,
        error,
      });

      if (status !== undefined && BACKEND_GAP_STATUSES.has(status)) {
        toast.danger("People merge unavailable", {
          description:
            "The platform-admin merge endpoint has not shipped yet. Try again once the backend rolls out.",
        });
      } else {
        toast.danger("Merge failed", {
          description:
            error instanceof Error ? error.message : "An unexpected error blocked the merge.",
        });
      }
    } finally {
      setConfirmOpen(false);
      setIsMerging(false);
    }
  }, [navigate, note, selection, source.person, target.person]);

  return (
    <ShowView resource="people" title="Merge people">
      <div className="flex flex-col gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Source & target</Card.Title>
            <Card.Description>
              The source is retired and its identifiers are absorbed by the target. This is a
              destructive, platform-admin-only operation.
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                aria-label="Source person id"
                name="source_id"
                value={sourceIdInput}
                variant="secondary"
                onChange={setSourceIdInput}
              >
                <Label>Source person id</Label>
                <Input placeholder="01H7…" />
              </TextField>
              <div className="flex items-end">
                <Button size="sm" variant="secondary" onPress={loadSource}>
                  Load source
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card variant="secondary">
                <Card.Header>
                  <Card.Title>Source · merged FROM</Card.Title>
                </Card.Header>
                <Card.Content>
                  {source.isLoading ? (
                    <div className="flex h-24 items-center justify-center">
                      <Spinner aria-label="Loading source person" />
                    </div>
                  ) : source.person ? (
                    <PersonHeader person={source.person} size="sm" />
                  ) : (
                    <p className="text-sm text-muted">
                      {sourceId
                        ? "The source person could not be loaded. The People backend may not be available."
                        : "Enter a source person id and click Load source."}
                    </p>
                  )}
                </Card.Content>
              </Card>

              <Card variant="secondary">
                <Card.Header>
                  <Card.Title>Target · merged INTO</Card.Title>
                </Card.Header>
                <Card.Content>
                  {target.isLoading ? (
                    <div className="flex h-24 items-center justify-center">
                      <Spinner aria-label="Loading target person" />
                    </div>
                  ) : target.person ? (
                    <PersonHeader person={target.person} size="sm" />
                  ) : (
                    <p className="text-sm text-muted">
                      The target person could not be loaded. The People backend may not be
                      available.
                    </p>
                  )}
                </Card.Content>
              </Card>
            </div>
          </Card.Content>
        </Card>

        <MergeFieldSelector
          selection={selection}
          source={source.person}
          target={target.person}
          onChange={(next) => {
            // The reducer is source of truth — dispatch a `pick` action per
            // field that actually changed. The selector already funnels one
            // call per change, so a single pass suffices.
            for (const field of MERGEABLE_FIELDS) {
              if (next[field] !== selection[field]) {
                dispatch({ type: "pick", field, side: next[field] });
              }
            }
          }}
        />

        <Card>
          <Card.Header>
            <Card.Title>Merge note</Card.Title>
            <Card.Description>
              Recorded on the audit trail alongside your operator id.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <TextField
              aria-label="Merge note"
              name="note"
              value={note}
              variant="secondary"
              onChange={setNote}
            >
              <Label>Note</Label>
              <Input placeholder="Reason for merge…" />
            </TextField>
          </Card.Content>
          <Card.Footer className="justify-end gap-2">
            <Button
              variant="ghost"
              onPress={() => {
                dispatch({ type: "reset" });
                setNote("");
              }}
            >
              Reset
            </Button>
            <Button
              isDisabled={!source.person || !target.person || isMerging}
              onPress={() => setConfirmOpen(true)}
            >
              Merge
            </Button>
          </Card.Footer>
        </Card>
      </div>

      <AlertDialog.Backdrop isOpen={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[420px]">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Confirm merge</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                The source person will be retired and every downstream identifier will be re-pointed
                at the target. This is not reversible from the UI.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                isPending={isMerging}
                variant="danger"
                onPress={() => {
                  void commitMerge();
                }}
              >
                Merge
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </ShowView>
  );
}
