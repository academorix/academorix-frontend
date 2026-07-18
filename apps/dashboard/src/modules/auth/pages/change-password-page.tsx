/**
 * @file change-password-page.tsx
 * @module modules/auth/pages/change-password-page
 *
 * @description
 * Protected "change my password" form (`/settings/security/change-password`).
 * Calls `POST /auth/change-password` (tenant) or `POST /v1/platform/auth/change-password`
 * (platform) via the surface-specific auth API. The backend revokes every
 * *other* Sanctum token on success so the presenting session survives.
 */

import { Button, Description, Form, Input, Label, TextField } from "@stackra/ui/react";
import { useState } from "react";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { PasswordChecklist } from "@/modules/auth/components/password-checklist";
import { platformAuthApi, tenantAuthApi } from "@/providers/auth";
import { validatePassword } from "@/providers/auth/password-policy";

/** The change-password page. */
export default function ChangePasswordPage(): ReactNode {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMockMode = tenantAuthApi === null && platformAuthApi === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (isMockMode) {
      setSuccess(true);
      setCurrent("");
      setPassword("");
      setConfirmation("");

      return;
    }

    const policy = validatePassword(password);

    if (!policy.isValid) {
      setError("New password does not meet the requirements below.");

      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");

      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        current_password: current,
        password,
        password_confirmation: confirmation,
      };

      if (platformAuthApi) {
        await platformAuthApi.changePassword(payload);
      } else if (tenantAuthApi) {
        await tenantAuthApi.changePassword(payload);
      }

      setSuccess(true);
      setCurrent("");
      setPassword("");
      setConfirmation("");
    } catch (caught) {
      setError((caught as ApiError).message || "Change failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard description="Update the password for your account." title="Change password">
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 px-6 pb-2">
          <TextField
            isRequired
            name="current_password"
            type="password"
            value={current}
            onChange={setCurrent}
          >
            <Label>Current password</Label>
            <Input autoComplete="current-password" placeholder="••••••••" variant="secondary" />
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
          {success ? (
            <Description className="text-success">Password updated successfully.</Description>
          ) : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving…" : "Update password"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
