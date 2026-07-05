/**
 * @file register-page.tsx
 * @module modules/auth/pages/register-page
 *
 * @description
 * Public tenant sign-up screen (`/register`). Submits `POST /api/auth/register`
 * via {@link tenantAuthApi.register}; on success flashes a "check your email"
 * message and routes back to `/login`. The backend does NOT auto-issue a token
 * — the user must sign in afterwards (matches PLAN.md §9.2).
 */

import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { PasswordChecklist } from "@/modules/auth/components/password-checklist";
import { tenantAuthApi } from "@/providers/auth";
import { validatePassword } from "@/providers/auth/password-policy";

/** Form field ids typed as literals to key the errors map. */
type FieldKey = "name" | "email" | "password" | "password_confirmation";

/** Field-level validation errors surfaced by the backend (422). */
type FieldErrors = Partial<Record<FieldKey, string>>;

/** Extracts the first message per field from an `ApiError.errors` payload. */
function extractFieldErrors(error: ApiError): FieldErrors {
  const errors: FieldErrors = {};

  if (!error.errors) {
    return errors;
  }

  for (const [field, messages] of Object.entries(error.errors)) {
    const first = Array.isArray(messages) ? messages[0] : messages;

    errors[field as FieldKey] = typeof first === "string" ? first : undefined;
  }

  return errors;
}

/** The register page. */
export default function RegisterPage(): ReactNode {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMockMode = tenantAuthApi === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    if (isMockMode) {
      setGeneralError("Registration is disabled while running against fixtures.");

      return;
    }

    const policy = validatePassword(password);

    if (!policy.isValid) {
      setFieldErrors({ password: "Password does not meet the requirements below." });

      return;
    }

    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: "Passwords do not match." });

      return;
    }

    setIsSubmitting(true);

    try {
      await tenantAuthApi!.register({
        name,
        email,
        password,
        password_confirmation: confirmation,
      });

      navigate(`${appRoutes.login}?flash=check-email`, { replace: true });
    } catch (error) {
      const err = error as ApiError;

      if (err.statusCode === 422 && err.errors) {
        setFieldErrors(extractFieldErrors(err));
      } else {
        setGeneralError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      description="Sign up to your academy workspace."
      footer={
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link className="text-accent hover:underline" to={appRoutes.login}>
            Sign in
          </Link>
        </p>
      }
      title="Create your account"
    >
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 px-6 pb-2">
          <TextField isRequired name="name" value={name} onChange={setName}>
            <Label>Full name</Label>
            <Input autoComplete="name" placeholder="Alex Rivera" variant="secondary" />
          </TextField>
          {fieldErrors.name ? (
            <Description className="text-danger">{fieldErrors.name}</Description>
          ) : null}

          <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
            <Label>Email</Label>
            <Input autoComplete="email" placeholder="you@academy.com" variant="secondary" />
          </TextField>
          {fieldErrors.email ? (
            <Description className="text-danger">{fieldErrors.email}</Description>
          ) : null}

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
          {fieldErrors.password ? (
            <Description className="text-danger">{fieldErrors.password}</Description>
          ) : null}

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
          {fieldErrors.password_confirmation ? (
            <Description className="text-danger">{fieldErrors.password_confirmation}</Description>
          ) : null}

          {generalError ? <Description className="text-danger">{generalError}</Description> : null}
          {isMockMode ? (
            <Description className="text-xs">
              Mock mode: registration is available in the real backend only.
            </Description>
          ) : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
