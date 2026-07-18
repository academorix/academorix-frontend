/**
 * @file forgot-password-page.tsx
 * @module modules/auth/pages/forgot-password-page
 *
 * @description
 * Public "email me a reset link" form (`/forgot-password`). Submits
 * `POST /api/auth/forgot-password` — the backend **always** returns HTTP 200
 * regardless of whether the email exists (anti-enumeration), so the UI shows
 * the same success message either way.
 */

import { Button, Description, Form, Input, Label, TextField } from "@stackra/ui/react";
import { useState } from "react";
import { Link, useNavigate } from "@stackra/routing/react";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { tenantAuthApi } from "@/providers/auth";

/** The forgot-password page. */
export default function ForgotPasswordPage(): ReactNode {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const isMockMode = tenantAuthApi === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (isMockMode) {
      // Fixture flow: mimic the always-succeed contract.
      setState("sent");

      return;
    }

    setState("submitting");

    try {
      await tenantAuthApi!.forgotPassword(email);
      setState("sent");
    } catch (caught) {
      setError((caught as ApiError).message || "Request failed. Please try again.");
      setState("idle");
    }
  };

  return (
    <AuthCard
      description="We will email a reset link if this address is on file."
      footer={
        <p className="text-center text-sm text-muted">
          Remembered it?{" "}
          <Link className="text-accent hover:underline" to={appRoutes.login}>
            Back to sign in
          </Link>
        </p>
      }
      title="Reset your password"
    >
      {state === "sent" ? (
        <div className="flex flex-col gap-4 px-6 pb-6">
          <p className="text-sm text-foreground">
            If an account exists with that email, we have sent password-reset instructions.
          </p>
          <p className="text-sm text-muted">
            The link expires in 60 minutes. Check your spam folder if you don&apos;t see it.
          </p>
          <Button className="w-full" variant="secondary" onPress={() => navigate(appRoutes.login)}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <Form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 px-6 pb-2">
            <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
              <Label>Email</Label>
              <Input autoComplete="email" placeholder="you@academy.com" variant="secondary" />
            </TextField>

            {error ? <Description className="text-danger">{error}</Description> : null}
          </div>

          <div className="mt-4 px-6 pb-6">
            <Button className="w-full" isDisabled={state === "submitting"} type="submit">
              {state === "submitting" ? "Sending…" : "Send reset link"}
            </Button>
          </div>
        </Form>
      )}
    </AuthCard>
  );
}
