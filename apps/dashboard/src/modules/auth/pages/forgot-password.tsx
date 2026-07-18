/**
 * @file forgot-password.tsx
 * @module modules/auth/pages/forgot-password
 *
 * @description
 * Password-reset request page. User enters their email; server queues
 * a reset email (always 200 to defeat enumeration). The confirmation
 * view is a mirror of the find-workspaces "sent" screen so the two
 * flows read as siblings.
 */

import { Button, Form, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import { Link } from "@stackra/routing/react";

import type { FormEvent, ReactNode } from "react";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ApiError } from "@/lib/api/http-client";
import { authApi } from "@/lib/api/auth-api";

import { Iconify } from "@/icons/iconify";

type ViewState = "form" | "sent";

export default function ForgotPasswordPage(): ReactNode {
  const [view, setView] = useState<ViewState>("form");
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmed = email.trim();

    if (!trimmed) return;

    setSubmitting(true);
    setFormError(null);

    try {
      await authApi.forgotPassword({ email: trimmed });
      setView("sent");
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't send the reset email. Check your connection and try again.";

      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "sent") {
    return (
      <AuthShell
        description="If an account with that email exists, we've sent a reset link. It expires in 60 minutes."
        title="Check your email"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-secondary/40 p-4 text-sm">
            <Iconify className="mt-0.5 size-5 shrink-0 text-accent" icon="envelope" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Reset link sent</p>
              <p className="text-xs leading-relaxed text-muted">
                We only send an email when the address is a registered account — the response is the
                same either way so this page can't be used to discover other users.
              </p>
            </div>
          </div>

          <Button
            fullWidth
            onPress={() => {
              setView("form");
              setEmail("");
            }}
            variant="secondary"
          >
            Try another email
          </Button>

          <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="Enter your email and we'll send you a link to reset your password."
      title="Forgot your password?"
    >
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField isRequired name="email" onChange={setEmail} type="email" value={email}>
          <Label>Email</Label>
          <Input autoComplete="email" autoFocus placeholder="you@example.com" spellCheck={false} />
        </TextField>

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
          Send reset link
        </Button>

        <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
          Back to sign in
        </Link>
      </Form>
    </AuthShell>
  );
}
