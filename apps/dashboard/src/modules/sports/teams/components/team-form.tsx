/**
 * @file team-form.tsx
 * @module modules/sports/teams/components/team-form
 *
 * @description
 * Shared create/edit form for a team (squad/class). Controlled form seeded from
 * optional initial values; sport options come from the `sports` resource, and
 * branch/season options come from the caller's accessible scope.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useState } from "react";

import type { EntityStatus, SkillLevel, Sport, Team } from "@/types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import { ENTITY_STATUSES, ENTITY_STATUS_LABELS, SKILL_LEVEL_LABELS, SKILL_LEVELS } from "@/types";

/** Editable fields of a team (excludes server-managed columns). */
export interface TeamFormValues {
  name: string;
  description: string;
  sport_key: string;
  branch_id: string;
  season_id: string;
  age_group: string;
  level: SkillLevel;
  capacity: string;
  status: EntityStatus;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(
  scopeBranchId: string | null,
  scopeSeasonId: string | null,
  initial?: Partial<Team>,
): TeamFormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    sport_key: initial?.sport_key ?? "",
    branch_id: initial?.branch_id ?? scopeBranchId ?? "",
    season_id: initial?.season_id ?? scopeSeasonId ?? "",
    age_group: initial?.age_group ?? "",
    level: initial?.level ?? "beginner",
    capacity: initial?.capacity != null ? String(initial.capacity) : "0",
    status: initial?.status ?? "active",
  };
}

/** Converts form values into a team API payload. */
export function toTeamPayload(values: TeamFormValues): Partial<Team> {
  return {
    name: values.name.trim(),
    description: values.description.trim() === "" ? null : values.description.trim(),
    sport_key: values.sport_key,
    branch_id: values.branch_id,
    season_id: values.season_id === "" ? null : values.season_id,
    age_group: values.age_group.trim(),
    level: values.level,
    capacity: Number.parseInt(values.capacity, 10) || 0,
    status: values.status,
  };
}

/** Props for {@link TeamForm}. */
interface TeamFormProps {
  initialValues?: Partial<Team>;
  isSubmitting: boolean;
  onSubmit: (values: TeamFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled team create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function TeamForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: TeamFormProps): ReactNode {
  const { scope, allowed } = useScope();
  const { result: sportsResult } = useList<Sport>({
    resource: "sports",
    pagination: { mode: "off" },
  });
  const sports = sportsResult?.data ?? [];

  const [values, setValues] = useState<TeamFormValues>(() =>
    toFormValues(scope.branchId, scope.seasonId, initialValues),
  );

  const setField = <K extends keyof TeamFormValues>(key: K, value: TeamFormValues[K]): void => {
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
              name="name"
              value={values.name}
              variant="secondary"
              onChange={(value) => setField("name", value)}
            >
              <Label>Name</Label>
              <Input placeholder="U12 Falcons" />
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
              placeholder="Select branch"
              value={values.branch_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("branch_id", key ? String(key) : "")}
            >
              <Label>Branch</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {allowed.branches.map((branch) => (
                    <ListBox.Item key={branch.id} id={branch.id} textValue={branch.name}>
                      {branch.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select season"
              value={values.season_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("season_id", key ? String(key) : "")}
            >
              <Label>Season</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {allowed.seasons.map((season) => (
                    <ListBox.Item key={season.id} id={season.id} textValue={season.name}>
                      {season.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="age_group"
              value={values.age_group}
              variant="secondary"
              onChange={(value) => setField("age_group", value)}
            >
              <Label>Age group</Label>
              <Input placeholder="U12" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select level"
              value={values.level}
              variant="secondary"
              onChange={(key: Key | null) => setField("level", key as SkillLevel)}
            >
              <Label>Level</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {SKILL_LEVELS.map((level) => (
                    <ListBox.Item key={level} id={level} textValue={SKILL_LEVEL_LABELS[level]}>
                      {SKILL_LEVEL_LABELS[level]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              name="capacity"
              type="number"
              value={values.capacity}
              variant="secondary"
              onChange={(value) => setField("capacity", value)}
            >
              <Label>Capacity</Label>
              <Input min="0" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as EntityStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {ENTITY_STATUSES.map((status) => (
                    <ListBox.Item key={status} id={status} textValue={ENTITY_STATUS_LABELS[status]}>
                      {ENTITY_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="sm:col-span-2">
              <TextField
                name="description"
                value={values.description}
                variant="secondary"
                onChange={(value) => setField("description", value)}
              >
                <Label>Description</Label>
                <TextArea placeholder="Optional notes about the team" rows={3} />
              </TextField>
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
