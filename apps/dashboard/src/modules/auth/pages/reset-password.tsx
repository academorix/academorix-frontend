/**
 * @file reset-password.tsx
 * @module modules/auth/pages/reset-password
 *
 * @description
 * Landing page for the password-reset email link. Consumes the
 * `token` + `email` query params from the reset email and swaps them
 * with a new password. On success the user is bounced to `/sign-in`
 * (never auto-authenticated — Req 10.7 in the backend spec).
 *
 * ## Missing / malformed params
 *
 * The reset email always ships both params; if either is missing the
 * page renders an "Invalid or expired reset link" screen instead of
 * a blank form. Kept as a client-side check because the backend
 * doesn't validate the token until submit, and rendering a broken
 * form is worse UX than an early-out.
 */

import { Button, Form } from "@heroui/react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "@stackra/routing/react";

import type { FormEvent, ReactNode } from "react";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ApiError } from "@/lib/api/http-client";
import { PasswordField } from "@/modules/auth/components/password-field";
import { authApi } from "@/lib/api/auth-api";

import { Iconify } from "@/icons/iconify";

/** Minimum password length enforced client-side. Backend enforces its own rules on top. */
const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage(): ReactNode {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!token || !email) {
    return (
      <AuthShell
        description="The reset link is missing required information. Request a new one to continue."
        title="Invalid or expired reset link"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
            <Iconify className="mt-0.5 size-5 shrink-0 text-danger" icon="triangle-exclamation" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Reset link is not usable</p>
              <p className="text-xs leading-relaxed text-muted">
                Follow the most recent reset email from your inbox, or request a new one below.
              </p>
            </div>
          </div>

          <Link to="/forgot-password">
            <Button fullWidth variant="primary">
              Request a new reset link
            </Button>
          </Link>

          <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // WHY the client-side confirmation check: the backend also
    // enforces this but showing the error immediately is much
    // better UX than a round trip.
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
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: confirmation,
      });

      // Success — bounce to sign-in with a query hint so the sign-in
      // page can show a success toast. Never auto-authenticate; the
      // backend deliberately doesn't mint a token here (Req 10.7).
      navigate("/sign-in?reset=1", { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setFormError(caught.message);

        return;
      }

      setFormError("We couldn't reset your password. Try requesting a new link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell description={`Set a new password for ${email}.`} title="Reset your password">
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <PasswordField
          autoComplete="new-password"
          autoFocus
          description={`At least ${MIN_PASSWORD_LENGTH} characters. Mix letters, numbers, and symbols.`}
          errorMessage={fieldErrors.password}
          isRequired
          label="New password"
          minLength={MIN_PASSWORD_LENGTH}
          name="password"
          onChange={setPassword}
          placeholder="Enter a new password"
          value={password}
        />

        <PasswordField
          autoComplete="new-password"
          errorMessage={fieldErrors.password_confirmation}
          isRequired
          label="Confirm new password"
          minLength={MIN_PASSWORD_LENGTH}
          name="password_confirmation"
          onChange={setConfirmation}
          placeholder="Re-enter your new password"
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
          Reset password
        </Button>

        <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
          Back to sign in
        </Link>
      </Form>
    </AuthShell>
  );
}
