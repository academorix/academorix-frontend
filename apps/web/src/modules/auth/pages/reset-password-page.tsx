/**
 * @file reset-password-page.tsx
 * @module modules/auth/pages/reset-password-page
 *
 * @description
 * Public reset-password form (`/reset-password?token=…&email=…`). Consumes the
 * emailed link's query params, POSTs the new password to
 * `POST /api/auth/reset-password`, then bounces to `/login` on success —
 * the backend revokes every token and does not issue a new one, so the caller
 * must sign in fresh.
 */

import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PasswordChecklist } from "@/modules/auth/components/password-checklist";
import { tenantAuthApi } from "@/providers/auth";
import { validatePassword } from "@/providers/auth/password-policy";

/** The reset-password page. */
export default function ResetPasswordPage(): ReactNode {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token") ?? "";
  const emailParam = params.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMockMode = tenantAuthApi === null;
  const missingParams = !token || !emailParam;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (isMockMode) {
      navigate(`${appRoutes.login}?flash=password-reset`, { replace: true });

      return;
    }

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
      await tenantAuthApi!.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });

      navigate(`${appRoutes.login}?flash=password-reset`, { replace: true });
    } catch (caught) {
      const err = caught as ApiError;

      setError(err.message || "Reset failed. The link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (missingParams) {
    return (
      <AuthCard
        description="This reset link is missing required information."
        title="Invalid reset link"
      >
        <div className="flex flex-col gap-4 px-6 pb-6">
          <p className="text-sm text-muted">
            The link you followed does not include the token or email. Please request a new one.
          </p>
          <Button
            className="w-full"
            variant="secondary"
            onPress={() => navigate(appRoutes.forgotPassword)}
          >
            Request a new link
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      description="Choose a new password for your account."
      footer={
        <p className="text-center text-sm text-muted">
          <Link className="text-accent hover:underline" to={appRoutes.login}>
            Back to sign in
          </Link>
        </p>
      }
      title="Reset your password"
    >
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 px-6 pb-2">
          <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
            <Label>Email</Label>
            <Input autoComplete="email" variant="secondary" />
          </TextField>

          <TextField
            isRequired
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
          >
            <Label>New password</Label>
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
            <Label>Confirm new password</Label>
            <Input autoComplete="new-password" placeholder="••••••••••••" variant="secondary" />
          </TextField>

          {error ? <Description className="text-danger">{error}</Description> : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
