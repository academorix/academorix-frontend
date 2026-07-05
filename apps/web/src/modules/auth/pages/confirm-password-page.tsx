/**
 * @file confirm-password-page.tsx
 * @module modules/auth/pages/confirm-password-page
 *
 * @description
 * Protected password step-up form (`/settings/security/confirm-password`).
 * Sensitive endpoints (change-password, 2FA recovery-codes, impersonation)
 * require a fresh `POST /auth/confirm-password` marker keyed to the current
 * Sanctum token. This page collects the current password, writes the marker
 * server-side, then returns to `?next=…`.
 */

import { LockClosedIcon } from "@academorix/ui/icons/outline";
import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { platformAuthApi, tenantAuthApi } from "@/providers/auth";

/** The confirm-password page. */
export default function ConfirmPasswordPage(): ReactNode {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextPath = params.get("next") ?? appRoutes.dashboard;

  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMockMode = tenantAuthApi === null && platformAuthApi === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (isMockMode) {
      // Mock mode: nothing to write server-side; pretend it worked.
      navigate(nextPath, { replace: true });

      return;
    }

    setIsSubmitting(true);

    try {
      // Whichever surface is live handles the request.
      if (platformAuthApi) {
        await platformAuthApi.confirmPassword(password);
      } else if (tenantAuthApi) {
        await tenantAuthApi.confirmPassword(password);
      }

      navigate(nextPath, { replace: true });
    } catch (caught) {
      setError((caught as ApiError).message || "Password did not match.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard description="Re-enter your password to continue." title="Confirm your password">
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col items-center gap-4 px-6 pb-2 text-center">
          <LockClosedIcon aria-hidden="true" className="size-10 text-accent" />
          <p className="text-sm text-muted">
            This is a sensitive action, so we ask for your password again.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-2">
          <TextField
            isRequired
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
          >
            <Label>Password</Label>
            <Input autoComplete="current-password" placeholder="••••••••" variant="secondary" />
          </TextField>

          {error ? <Description className="text-danger">{error}</Description> : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Confirming…" : "Confirm"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
