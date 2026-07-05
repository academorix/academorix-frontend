/**
 * @file create-workspace-page.tsx
 * @module modules/workspace/pages/create-workspace-page
 *
 * @description
 * Self-serve tenant creation (central host `/create-workspace`). Provisions a
 * new Academorix tenant + a default owner user, then navigates the browser to
 * the new subdomain's login page.
 *
 * Backend contract: `POST /api/v1/tenants/register` (PLAN.md gap G5).
 * Currently only the platform-admin `POST /api/v1/tenants` endpoint exists,
 * so this page targets the new public endpoint the backend team is asked to
 * add; in mock mode we simulate the flow so the demo journey is complete.
 */

import { RocketLaunchIcon } from "@academorix/ui/icons/outline";
import {
  Button,
  Description,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@academorix/ui/react";
import { useState } from "react";
import { Link } from "react-router";

import type { ApiError } from "@/lib/http";
import type { FormEvent, Key, ReactNode } from "react";

import { env } from "@/config/env";
import { buildTenantUrl, httpClient } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PasswordChecklist } from "@/modules/auth/components/password-checklist";
import { validatePassword } from "@/providers/auth/password-policy";

/** Business types the backend recognises (mirrors `Tenancy\BusinessType`). */
const BUSINESS_TYPES: { id: string; label: string }[] = [
  { id: "academy", label: "Academy" },
  { id: "sports_center", label: "Sports Center" },
  { id: "gym", label: "Gym" },
  { id: "activity_center", label: "Activity Center" },
  { id: "club", label: "Club" },
  { id: "multi_sport", label: "Multi-Sport" },
];

/** The create-workspace page. */
export default function CreateWorkspacePage(): ReactNode {
  const [workspaceName, setWorkspaceName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState("academy");

  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Slugifies a workspace name into a URL-safe subdomain. */
  const suggestSlugFrom = (name: string): void => {
    if (slug.length > 0) {
      return;
    }

    const suggested = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setSlug(suggested);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const policy = validatePassword(password);

    if (!policy.isValid) {
      setError("Password does not meet the requirements below.");

      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");

      return;
    }

    setIsSubmitting(true);

    try {
      if (env.VITE_API_MOCK) {
        // Fixture mode: pretend we provisioned successfully, then bounce to
        // the new tenant's login. A real backend call happens in REST mode.
        window.setTimeout(() => {
          window.location.href = buildTenantUrl(slug, appRoutes.login);
        }, 300);

        return;
      }

      await httpClient.post("/v1/tenants/register", {
        workspace_name: workspaceName,
        slug,
        business_type: businessType,
        owner: {
          name: ownerName,
          email: ownerEmail,
          password,
          password_confirmation: confirmation,
        },
      });

      window.location.href = buildTenantUrl(slug, appRoutes.login);
    } catch (caught) {
      const err = caught as ApiError;

      setError(err.message || "Could not create the workspace. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      description="Provision a new academy workspace and its owner account."
      footer={
        <p className="text-center text-sm text-muted">
          Already have a workspace?{" "}
          <Link className="text-accent hover:underline" to={appRoutes.workspacePicker}>
            Pick a workspace
          </Link>
        </p>
      }
      title="Create a workspace"
    >
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6 px-6 pb-2">
          <section aria-labelledby="workspace-heading" className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <RocketLaunchIcon aria-hidden="true" className="size-5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground" id="workspace-heading">
                Your workspace
              </h3>
            </div>

            <TextField
              isRequired
              name="workspace_name"
              value={workspaceName}
              onChange={(value) => {
                setWorkspaceName(value);
                suggestSlugFrom(value);
              }}
            >
              <Label>Workspace name</Label>
              <Input placeholder="Riverside Sports Academy" variant="secondary" />
            </TextField>

            <TextField isRequired name="slug" value={slug} onChange={setSlug}>
              <Label>URL slug</Label>
              <Input placeholder="riverside" variant="secondary" />
            </TextField>

            <Select
              className="w-full"
              placeholder="Choose a business type"
              value={businessType}
              variant="secondary"
              onChange={(key: Key | null) =>
                setBusinessType(typeof key === "string" ? key : "academy")
              }
            >
              <Label>Business type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {BUSINESS_TYPES.map((entry) => (
                    <ListBox.Item key={entry.id} id={entry.id} textValue={entry.label}>
                      {entry.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </section>

          <section aria-labelledby="owner-heading" className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground" id="owner-heading">
              Owner account
            </h3>

            <TextField isRequired name="owner_name" value={ownerName} onChange={setOwnerName}>
              <Label>Full name</Label>
              <Input autoComplete="name" placeholder="Alex Rivera" variant="secondary" />
            </TextField>

            <TextField
              isRequired
              name="owner_email"
              type="email"
              value={ownerEmail}
              onChange={setOwnerEmail}
            >
              <Label>Email</Label>
              <Input autoComplete="email" placeholder="alex@academy.com" variant="secondary" />
            </TextField>

            <TextField
              isRequired
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
            >
              <Label>Password</Label>
              <Input autoComplete="new-password" placeholder="••••••••••••" variant="secondary" />
            </TextField>

            <PasswordChecklist value={password} />

            <TextField
              isRequired
              name="password_confirmation"
              type="password"
              value={confirmation}
              onChange={setConfirmation}
            >
              <Label>Confirm password</Label>
              <Input autoComplete="new-password" placeholder="••••••••••••" variant="secondary" />
            </TextField>
          </section>

          {error ? <Description className="text-danger">{error}</Description> : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Provisioning…" : "Create workspace"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
