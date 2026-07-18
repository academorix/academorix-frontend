/**
 * @file match-form.tsx
 * @module modules/sports/matches/components/match-form
 *
 * @description
 * Shared create/edit form for a match. Controlled form seeded from optional
 * initial values; sport options come from the `sports` resource and team options
 * from `teams`. Branch/season are injected from the caller's scope at submit
 * time (see {@link toMatchPayload}). Kick-off uses a `datetime-local` input.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { ActiveScope } from "@/lib/scope";
import type { Match, MatchStatus, Sport, Team } from "@/types";
import type { Key, ReactNode } from "react";

import { MATCH_STATUS_LABELS, MATCH_STATUSES } from "@/types";

/** Editable fields of a match (excludes server-managed + scope columns). */
export interface MatchFormValues {
  opponent: string;
  sport_key: string;
  team_id: string;
  is_home: boolean;
  status: MatchStatus;
  starts_at: string;
  location: string;
  /** Team's score as a raw input string (`""` when unset). */
  score_for: string;
  /** Opponent's score as a raw input string (`""` when unset). */
  score_against: string;
}

/** Trims an ISO timestamp to the `datetime-local` input format (`YYYY-MM-DDTHH:mm`). */
function toLocalInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

/** Renders a nullable numeric score as an input string (`""` when unset). */
function toScoreInput(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Match>): MatchFormValues {
  return {
    opponent: initial?.opponent ?? "",
    sport_key: initial?.sport_key ?? "",
    team_id: initial?.team_id ?? "",
    is_home: initial?.is_home ?? true,
    status: initial?.status ?? "scheduled",
    starts_at: toLocalInput(initial?.starts_at),
    location: initial?.location ?? "",
    score_for: toScoreInput(initial?.score_for),
    score_against: toScoreInput(initial?.score_against),
  };
}

/** Converts a raw score input string into a nullable number. */
function toScore(value: string): number | null {
  return value === "" ? null : Number(value);
}

/**
 * Converts form values into a match API payload, injecting the active branch and
 * season from the caller's scope.
 */
export function toMatchPayload(values: MatchFormValues, scope: ActiveScope): Partial<Match> {
  return {
    opponent: values.opponent.trim(),
    sport_key: values.sport_key,
    team_id: values.team_id,
    is_home: values.is_home,
    status: values.status,
    starts_at: values.starts_at,
    location: values.location.trim() === "" ? null : values.location.trim(),
    score_for: toScore(values.score_for),
    score_against: toScore(values.score_against),
    branch_id: scope.branchId ?? "",
    season_id: scope.seasonId,
  };
}

/** Props for {@link MatchForm}. */
interface MatchFormProps {
  initialValues?: Partial<Match>;
  isSubmitting: boolean;
  onSubmit: (values: MatchFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled match create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function MatchForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: MatchFormProps): ReactNode {
  const { result: sportsResult } = useList<Sport>({
    resource: "sports",
    pagination: { mode: "off" },
  });
  const { result: teamsResult } = useList<Team>({ resource: "teams", pagination: { mode: "off" } });
  const sports = sportsResult?.data ?? [];
  const teams = teamsResult?.data ?? [];

  const [values, setValues] = useState<MatchFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof MatchFormValues>(key: K, value: MatchFormValues[K]): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              isRequired
              name="opponent"
              value={values.opponent}
              variant="secondary"
              onChange={(value) => setField("opponent", value)}
            >
              <Label>Opponent</Label>
              <Input placeholder="Rovers FC" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select sport"
              value={values.sport_key || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("sport_key", key ? String(key) : "")}
            >
              <Label>Sport</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {sports.map((sport) => (
                    <ListBox.Item key={sport.key} id={sport.key} textValue={sport.name}>
                      {sport.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select team"
              value={values.team_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("team_id", key ? String(key) : "")}
            >
              <Label>Team</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {teams.map((team) => (
                    <ListBox.Item key={team.id} id={team.id} textValue={team.name}>
                      {team.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as MatchStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {MATCH_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={MATCH_STATUS_LABELS[status]}>
                      {MATCH_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="starts_at"
              type="datetime-local"
              value={values.starts_at}
              variant="secondary"
              onChange={(value) => setField("starts_at", value)}
            >
              <Label>Kick-off</Label>
              <Input />
            </TextField>

            <TextField
              name="location"
              value={values.location}
              variant="secondary"
              onChange={(value) => setField("location", value)}
            >
              <Label>Location</Label>
              <Input placeholder="City Stadium" />
            </TextField>

            <TextField
              name="score_for"
              type="number"
              value={values.score_for}
              variant="secondary"
              onChange={(value) => setField("score_for", value)}
            >
              <Label>Score for</Label>
              <Input placeholder="0" />
            </TextField>

            <TextField
              name="score_against"
              type="number"
              value={values.score_against}
              variant="secondary"
              onChange={(value) => setField("score_against", value)}
            >
              <Label>Score against</Label>
              <Input placeholder="0" />
            </TextField>

            <div className="sm:col-span-2">
              <Switch isSelected={values.is_home} onChange={(value) => setField("is_home", value)}>
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Home match
                </Switch.Content>
              </Switch>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}
