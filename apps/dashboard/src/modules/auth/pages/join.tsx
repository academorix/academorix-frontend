/**
 * @file join.tsx
 * @module modules/auth/pages/join
 *
 * @description
 * Invite-acceptance surface for `/join/:token`. The invited person
 * clicks the link in their invitation email, lands here, and creates
 * their account within the invitee's tenant workspace. The invitation
 * token is carried in the URL and passed through to
 * `POST /api/auth/register` — the server maps it to the pending
 * membership row + activates the account atomically.
 *
 * ## Two states
 *
 *   - **form** — new account creation. Prefills the email when the
 *     invite email travels alongside the token as `?email=...`.
 *   - **accepted** — success card with a CTA into sign-in (or
 *     dashboard if the register response already carries a token).
 *
 * ## Missing token
 *
 * The router registers the route as `/join/:token`, so hitting
 * `/join` bare 404s at the router level. A tampered / malformed
 * token still resolves the route — the register endpoint rejects
 * it with 422 and we surface the message inline.
 */

import { Button, Description, Form, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "@stackra/routing/react";

import type { FormEvent, ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { Iconify } from "@/icons/iconify";
import { PasswordField } from "@/modules/auth/components/password-field";
import { authApi } from "@/lib/api/auth-api";

const MIN_PASSWORD_LENGTH = 8;

type ViewState = "form" | "accepted";

export default function JoinPage(): ReactNode {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  const [view, setView] = useState<ViewState>("form");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>(searchParams.get("email") ?? "");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!token) {
    return (
      <AuthShell
        description="Follow the invitation link from your email to accept the invite."
        title="Invalid invitation link"
      >
        <div className="flex flex-col gap-4">
          <Link to="/sign-in">
            <Button fullWidth variant="primary">
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: "Passwords don't match." });

      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldErrors({
        password: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });

      return;
    }

    setSubmitting(true);

    try {
      await authApi.register({
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmation,
        invitation_token: token,
      });

      setView("accepted");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setFormError(caught.message);

        return;
      }

      setFormError("We couldn't accept your invitation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "accepted") {
    return (
      <AuthShell
        description="Your invitation was accepted. Sign in to start collaborating."
        title="You're in"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
            <Iconify className="mt-0.5 size-5 shrink-0 text-success" icon="circle-check" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Welcome to the team</p>
              <p className="text-xs leading-relaxed text-muted">
                Your account is ready. Sign in with your email + password to jump into the
                workspace.
              </p>
            </div>
          </div>

          <Link to="/sign-in">
            <Button fullWidth variant="primary">
              Sign in to your workspace
              <Iconify className="size-4" icon="arrow-right" />
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="Set up your account to join the workspace."
      footer={
        <span>
          Already have an account?{" "}
          <Link className="font-semibold text-foreground hover:underline" to="/sign-in">
            Sign in
          </Link>
        </span>
      }
      title="Accept your invitation"
    >
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          isInvalid={Boolean(fieldErrors.full_name)}
          isRequired
          name="full_name"
          onChange={setFullName}
          value={fullName}
        >
          <Label>Your name</Label>
          <Input autoComplete="name" autoFocus placeholder="Alex Morgan" />
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
            <Description>The email your invitation was sent to.</Description>
          )}
        </TextField>

        <PasswordField
          autoComplete="new-password"
          description="At least 8 characters."
          errorMessage={fieldErrors.password}
          isRequired
          label="Password"
          minLength={MIN_PASSWORD_LENGTH}
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
          minLength={MIN_PASSWORD_LENGTH}
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

        <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
          Accept invitation
          <Iconify className="size-4" icon="arrow-right" />
        </Button>
      </Form>
    </AuthShell>
  );
}
