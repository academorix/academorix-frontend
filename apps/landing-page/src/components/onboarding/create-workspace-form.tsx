/**
 * @file create-workspace-form.tsx
 * @module components/onboarding/create-workspace-form
 *
 * @description
 * Interactive form behind `/create-workspace`. Client Component that
 * receives fully-hydrated `businessTypes` + `passwordRules` + `site` from
 * the Server Component page.
 */

"use client";

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
import { useMemo, useState } from "react";

import type { BusinessTypeOption, PasswordRuleData, SiteData } from "@/lib/types";
import type { FormEvent, Key, ReactNode } from "react";

import { AuthCard } from "@/components/auth-card";
import { PasswordChecklist } from "@/components/password-checklist";
import { envConfig } from "@/config/env.config";
import { Link } from "@/i18n/navigation";
import { MarketingApiError, postJson } from "@/lib/api-client/http";
import { compilePasswordRules, validatePassword } from "@/lib/marketing/password";

/** Props for {@link CreateWorkspaceForm}. */
interface CreateWorkspaceFormProps {
  site: SiteData;
  businessTypes: readonly BusinessTypeOption[];
  passwordRules: readonly PasswordRuleData[];
}

/** Assembles the destination tenant URL after successful provision. */
function buildTenantLoginUrl(slug: string): string {
  const app = new URL(envConfig.appUrl);

  if (app.hostname.split(".").length >= 2 && app.hostname !== "localhost") {
    const [, ...rest] = app.hostname.split(".");

    app.hostname = [slug, ...rest].join(".");
  } else {
    app.searchParams.set("slug", slug);
  }

  app.pathname = "/login";

  return app.toString();
}

/** The create-workspace form. */
export function CreateWorkspaceForm({
  site,
  businessTypes,
  passwordRules,
}: CreateWorkspaceFormProps): ReactNode {
  const rules = useMemo(() => compilePasswordRules(passwordRules), [passwordRules]);

  const [workspaceName, setWorkspaceName] = useState("");
  const [slug, setSlug] = useState("");
  const [businessType, setBusinessType] = useState(businessTypes[0]?.id ?? "academy");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const policy = validatePassword(password, rules);

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
      await postJson<{ slug: string }>("/v1/tenants/register", {
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

      window.location.href = buildTenantLoginUrl(slug);
    } catch (caught) {
      if (caught instanceof MarketingApiError) {
        setError(caught.message);
      } else {
        setError("Could not create the workspace. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      description="Provision a new academy workspace and its owner account."
      footer={
        <p className="text-center text-sm text-muted">
          Already have a workspace?{" "}
          <Link className="text-accent hover:underline" href="/find-workspaces">
            Find your workspaces
          </Link>
        </p>
      }
      site={site}
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
                  {businessTypes.map((entry) => (
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

            <PasswordChecklist rules={rules} value={password} />

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
