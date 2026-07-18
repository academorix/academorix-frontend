/**
 * @file change-password-panel.tsx
 * @module modules/settings/pages/security/change-password-panel
 *
 * @description
 * Inline "Change password" form inside the Security settings page.
 *
 * ## Backend contract
 *
 * `POST /api/auth/change-password` verifies the current password
 * server-side, applies the new one, and revokes every OTHER Sanctum
 * token for the caller so the presenting session survives while
 * every other logged-in device drops back to `/sign-in`.
 *
 * ## UX contract
 *
 * - Success clears the fields + fires a toast that also mentions the
 *   sibling-session revocation ("Signed out on other devices").
 * - Field-level validation errors from the backend map through
 *   `ApiError.fieldErrors()` onto individual inputs.
 * - The submit button carries `isPending` while the network call is
 *   in flight so the user can't double-submit.
 */

import { Button, Description, FieldError, Form, toast } from "@heroui/react";
import { useState } from "react";

import type { FormEvent, ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { PasswordField } from "@/modules/auth/components/password-field";
import { authApi } from "@/lib/api/auth-api";

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordPanel(): ReactNode {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const reset = (): void => {
    setCurrentPassword("");
    setPassword("");
    setConfirmation("");
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

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
      await authApi.changePassword({
        current_password: currentPassword,
        password,
        password_confirmation: confirmation,
      });

      toast.success("Password changed", {
        description:
          "Every other signed-in device has been signed out. Your current session stays active.",
      });

      reset();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setFormError(caught.message);

        return;
      }

      setFormError("We couldn't change your password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Change password</h3>
        <p className="text-sm text-muted">
          Update your password. This signs you out on every other device you're logged in on.
        </p>
      </div>

      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <PasswordField
          autoComplete="current-password"
          errorMessage={fieldErrors.current_password}
          isDisabled={isSubmitting}
          isRequired
          label="Current password"
          name="current_password"
          onChange={setCurrentPassword}
          placeholder="Your current password"
          value={currentPassword}
        />

        <PasswordField
          autoComplete="new-password"
          description={`At least ${MIN_PASSWORD_LENGTH} characters. Mix letters, numbers, and symbols.`}
          errorMessage={fieldErrors.password}
          isDisabled={isSubmitting}
          isRequired
          label="New password"
          minLength={MIN_PASSWORD_LENGTH}
          name="password"
          onChange={setPassword}
          placeholder="Choose a strong password"
          value={password}
        />

        <PasswordField
          autoComplete="new-password"
          errorMessage={fieldErrors.password_confirmation}
          isDisabled={isSubmitting}
          isRequired
          label="Confirm new password"
          minLength={MIN_PASSWORD_LENGTH}
          name="password_confirmation"
          onChange={setConfirmation}
          placeholder="Re-enter your new password"
          value={confirmation}
        />

        {formError ? <FieldError>{formError}</FieldError> : null}

        <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3 text-sm">
          <Iconify className="mt-0.5 size-4 shrink-0 text-muted" icon="info" />
          <Description className="text-xs leading-relaxed text-muted">
            After the change lands, every other device signs out. Your current session — this
            browser tab — stays active so you don't lose your place.
          </Description>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button isDisabled={isSubmitting} onPress={reset} type="button" variant="secondary">
            Reset
          </Button>
          <Button isPending={isSubmitting} type="submit" variant="primary">
            Update password
          </Button>
        </div>
      </Form>
    </div>
  );
}
