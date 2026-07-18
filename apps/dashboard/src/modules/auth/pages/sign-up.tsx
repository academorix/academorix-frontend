/**
 * @file sign-up.tsx
 * @module modules/auth/pages/sign-up
 *
 * @description
 * Create a new workspace. Hits the central `/api/v1/signup` endpoint,
 * which provisions the tenant subdomain + seeds the owner user. On
 * success, redirects to the newly-created workspace's sign-in URL so
 * the owner can log in there.
 *
 * ## Central-host only
 *
 * The signup page renders a "wrong host" screen when accessed on a
 * tenant subdomain — new-workspace creation always originates from
 * the central host (`mydomain.com/sign-up`). Attempting to sign up
 * on a tenant subdomain would leave the newly-created workspace
 * unreachable through the URL you're already on.
 */

import { Button, Description, Form, Input, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { Link } from "@stackra/routing/react";

import type { FormEvent, ReactNode } from "react";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ApiError } from "@/lib/api/http-client";
import { PasswordField } from "@/modules/auth/components/password-field";
import { authApi } from "@/lib/api/auth-api";
import { buildCentralUrl, resolveWorkspace } from "@/lib/auth/workspace-resolver";

import { Iconify } from "@/icons/iconify";

/** DNS-safe slug pattern — mirrors the backend + the workspace picker. */
const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Slugify a display name for the workspace URL suggestion. Keeps
 * lowercase letters + digits + hyphens; collapses runs of non-word
 * characters into a single hyphen and trims leading/trailing.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export default function SignUpPage(): ReactNode {
  const workspace = resolveWorkspace();

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [workspaceSlug, setWorkspaceSlug] = useState<string>("");
  const [slugDirty, setSlugDirty] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // If the user hasn't typed the slug manually, derive it from the
  // workspace name so they don't have to think about it. `slugDirty`
  // flips once the user edits the slug field, at which point we
  // stop shadowing their input.
  const effectiveSlug = slugDirty ? workspaceSlug : slugify(workspaceName);

  if (workspace.mode === "tenant") {
    return (
      <AuthShell
        description="New workspaces are created from the main Academorix site."
        title="Create your workspace"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary/40 p-4 text-sm">
            <Iconify className="mt-0.5 size-5 shrink-0 text-accent" icon="info" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">You're on a tenant workspace</p>
              <p className="text-xs leading-relaxed text-muted">
                To create a new Academorix workspace, head to the main site.
              </p>
            </div>
          </div>

          <a href={`${buildCentralUrl()}/sign-up`}>
            <Button fullWidth variant="primary">
              Continue to sign up
            </Button>
          </a>

          <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
            Sign in instead
          </Link>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Client-side sanity checks — the backend re-validates, but
    // fast local feedback is better UX than a round trip.
    if (!WORKSPACE_SLUG_PATTERN.test(effectiveSlug)) {
      setFieldErrors({
        workspace_slug: "Workspace URL can only include lowercase letters, numbers, and hyphens.",
      });

      return;
    }

    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: "Passwords don't match." });

      return;
    }

    setSubmitting(true);

    try {
      const result = await authApi.signup({
        workspace_name: workspaceName,
        workspace_slug: effectiveSlug,
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmation,
        accepted_terms: true,
      });

      // WHY the full-URL redirect: the freshly-provisioned tenant
      // lives on its own subdomain. Client-side navigation would
      // never resolve it — we have to trigger a real browser
      // navigation to the new origin.
      window.location.assign(`${result.workspace_url}/sign-in?welcome=1`);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setFormError(caught.message);

        return;
      }

      setFormError("We couldn't create your workspace. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Set up a workspace for your organisation in about a minute."
      footer={
        <span>
          Already have a workspace?{" "}
          <Link className="font-medium text-foreground hover:underline" to="/sign-in">
            Sign in
          </Link>
        </span>
      }
      title="Create your workspace"
    >
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          isInvalid={Boolean(fieldErrors.workspace_name)}
          isRequired
          name="workspace_name"
          onChange={setWorkspaceName}
          value={workspaceName}
        >
          <Label>Organisation name</Label>
          <Input autoFocus placeholder="Acme Athletics" />
          {fieldErrors.workspace_name ? (
            <Description className="text-danger">{fieldErrors.workspace_name}</Description>
          ) : (
            <Description>The name your team will see across the app.</Description>
          )}
        </TextField>

        <TextField
          isInvalid={Boolean(fieldErrors.workspace_slug)}
          isRequired
          name="workspace_slug"
          onChange={(value) => {
            setWorkspaceSlug(value.toLowerCase());
            setSlugDirty(true);
          }}
          value={effectiveSlug}
        >
          <Label>Workspace URL</Label>
          <InputGroup fullWidth>
            <InputGroup.Input placeholder="acme-athletics" spellCheck={false} />
            <InputGroup.Suffix>.academorix.com</InputGroup.Suffix>
          </InputGroup>
          {fieldErrors.workspace_slug ? (
            <Description className="text-danger">{fieldErrors.workspace_slug}</Description>
          ) : (
            <Description>The URL your team will use to sign in.</Description>
          )}
        </TextField>

        <TextField
          isInvalid={Boolean(fieldErrors.full_name)}
          isRequired
          name="full_name"
          onChange={setFullName}
          value={fullName}
        >
          <Label>Your name</Label>
          <Input autoComplete="name" placeholder="Alex Morgan" />
          {fieldErrors.full_name ? (
            <Description className="text-danger">{fieldErrors.full_name}</Description>
          ) : null}
        </TextField>

        <TextField
          isInvalid={Boolean(fieldErrors.email)}
          isRequired
          name="email"
          onChange={setEmail}
          type="email"
          value={email}
        >
          <Label>Work email</Label>
          <Input autoComplete="email" placeholder="alex@company.com" spellCheck={false} />
          {fieldErrors.email ? (
            <Description className="text-danger">{fieldErrors.email}</Description>
          ) : (
            <Description>We'll send a verification link here.</Description>
          )}
        </TextField>

        <PasswordField
          autoComplete="new-password"
          description="At least 8 characters."
          errorMessage={fieldErrors.password}
          isRequired
          label="Password"
          minLength={8}
          name="password"
          onChange={setPassword}
          placeholder="Choose a strong password"
          value={password}
        />

        <PasswordField
          autoComplete="new-password"
          errorMessage={fieldErrors.password_confirmation}
          isRequired
          label="Confirm password"
          minLength={8}
          name="password_confirmation"
          onChange={setConfirmation}
          placeholder="Re-enter your password"
          value={confirmation}
        />

        {formError ? (
          <div
            aria-live="polite"
            className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted">
          By creating a workspace you agree to Academorix's{" "}
          <a className="text-foreground underline-offset-4 hover:underline" href="/terms">
            Terms
          </a>{" "}
          and{" "}
          <a className="text-foreground underline-offset-4 hover:underline" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>

        <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
          Create workspace
        </Button>
      </Form>
    </AuthShell>
  );
}
