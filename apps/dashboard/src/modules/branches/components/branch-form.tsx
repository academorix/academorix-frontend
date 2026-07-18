/**
 * @file branch-form.tsx
 * @module modules/branches/components/branch-form
 *
 * @description
 * Shared create/edit form for a branch (venue). Controlled form seeded from
 * optional initial values; the organization options come from the caller's
 * accessible scope and the region options are loaded from the `regions`
 * resource, so both work under the mock and REST providers.
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

import type { Branch, EntityStatus, Region } from "@/types";
import type { Key, ReactNode } from "react";

import { useScope } from "@/lib/scope";
import { ENTITY_STATUSES, ENTITY_STATUS_LABELS } from "@/types";

/** Editable fields of a branch (excludes server-managed columns). */
export interface BranchFormValues {
  name: string;
  slug: string;
  organization_id: string;
  region_id: string;
  status: EntityStatus;
  city: string;
  country: string;
  timezone: string;
  capacity: string;
  contact_email: string;
  contact_phone: string;
  is_default: boolean;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(scopeOrgId: string | null, initial?: Partial<Branch>): BranchFormValues {
  return {
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    organization_id: initial?.organization_id ?? scopeOrgId ?? "",
    region_id: initial?.region_id ?? "",
    status: initial?.status ?? "active",
    city: initial?.city ?? "",
    country: initial?.country ?? "",
    timezone: initial?.timezone ?? "America/New_York",
    capacity: initial?.capacity != null ? String(initial.capacity) : "0",
    contact_email: initial?.contact_email ?? "",
    contact_phone: initial?.contact_phone ?? "",
    is_default: initial?.is_default ?? false,
  };
}

/** Converts form values into a branch API payload (typed, trimmed, nullable-aware). */
export function toBranchPayload(values: BranchFormValues): Partial<Branch> {
  const emptyToNull = (value: string): string | null => {
    const trimmed = value.trim();

    return trimmed === "" ? null : trimmed;
  };

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    organization_id: values.organization_id,
    region_id: emptyToNull(values.region_id),
    status: values.status,
    city: values.city.trim(),
    country: values.country.trim(),
    timezone: values.timezone.trim(),
    capacity: Number.parseInt(values.capacity, 10) || 0,
    contact_email: emptyToNull(values.contact_email),
    contact_phone: emptyToNull(values.contact_phone),
    is_default: values.is_default,
  };
}

/** Props for {@link BranchForm}. */
interface BranchFormProps {
  /** Initial values (omit for create; pass the record for edit). */
  initialValues?: Partial<Branch>;
  /** Whether a submit is in flight. */
  isSubmitting: boolean;
  /** Called with the collected values on submit. */
  onSubmit: (values: BranchFormValues) => void;
  /** Submit button label. Defaults to "Save". */
  submitLabel?: string;
}

/**
 * A controlled branch create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function BranchForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: BranchFormProps): ReactNode {
  const { scope, allowed } = useScope();
  const { result: regionsResult } = useList<Region>({
    resource: "regions",
    pagination: { mode: "off" },
  });
  const regions = regionsResult?.data ?? [];

  const [values, setValues] = useState<BranchFormValues>(() =>
    toFormValues(scope.organizationId, initialValues),
  );

  const setField = <K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]): void => {
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
              <Input placeholder="Riverside HQ" />
            </TextField>

            <TextField
              isRequired
              name="slug"
              value={values.slug}
              variant="secondary"
              onChange={(value) => setField("slug", value)}
            >
              <Label>Slug</Label>
              <Input placeholder="riverside-hq" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Select organization"
              value={values.organization_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("organization_id", key ? String(key) : "")}
            >
              <Label>Organization</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {allowed.organizations.map((org) => (
                    <ListBox.Item key={org.id} id={org.id} textValue={org.name}>
                      {org.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select region"
              value={values.region_id || null}
              variant="secondary"
              onChange={(key: Key | null) => setField("region_id", key ? String(key) : "")}
            >
              <Label>Region</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {regions.map((region) => (
                    <ListBox.Item key={region.id} id={region.id} textValue={region.name}>
                      {region.name}
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

            <TextField
              name="city"
              value={values.city}
              variant="secondary"
              onChange={(value) => setField("city", value)}
            >
              <Label>City</Label>
              <Input placeholder="New York" />
            </TextField>

            <TextField
              name="country"
              value={values.country}
              variant="secondary"
              onChange={(value) => setField("country", value)}
            >
              <Label>Country</Label>
              <Input placeholder="US" />
            </TextField>

            <TextField
              name="timezone"
              value={values.timezone}
              variant="secondary"
              onChange={(value) => setField("timezone", value)}
            >
              <Label>Timezone</Label>
              <Input placeholder="America/New_York" />
            </TextField>

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

            <TextField
              name="contact_email"
              type="email"
              value={values.contact_email}
              variant="secondary"
              onChange={(value) => setField("contact_email", value)}
            >
              <Label>Contact email</Label>
              <Input placeholder="hq@example.com" />
            </TextField>

            <TextField
              name="contact_phone"
              type="tel"
              value={values.contact_phone}
              variant="secondary"
              onChange={(value) => setField("contact_phone", value)}
            >
              <Label>Contact phone</Label>
              <Input placeholder="+1 555 0100" />
            </TextField>

            <div className="flex items-center">
              <Switch
                isSelected={values.is_default}
                onChange={(selected) => setField("is_default", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Default branch
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
