/**
 * @file find-workspaces.tsx
 * @module modules/auth/pages/find-workspaces
 *
 * @description
 * Slack-style workspace recovery. The user enters their email; the
 * backend queues an email listing every tenant the address is a
 * member of. Response is **always the same 200 envelope**, regardless
 * of whether the email matched anything — the backend deliberately
 * makes hits and misses indistinguishable so the endpoint can't be
 * used as an enumeration oracle (see backend `FindWorkspacesController`).
 *
 * ## Visual language
 *
 * Uses the shared {@link AuthShell} centred-form layout so the page
 * reads as a natural sibling of sign-in / sign-up / reset-password.
 * Matches the landing page's `FindWorkspacesRoute` styling for
 * cross-origin continuity.
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

export default function FindWorkspacesPage(): ReactNode {
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
      await authApi.findWorkspaces({ email: trimmed });
      setView("sent");
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't send the email. Check your connection and try again.";

      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (view === "sent") {
    return (
      <AuthShell
        description="If any workspaces are linked to that email, we've sent them your way. Check your inbox in the next few minutes."
        title="Check your email"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface/70 p-4 text-sm backdrop-blur">
            <Iconify className="mt-0.5 size-5 shrink-0 text-accent" icon="envelope" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Delivery in progress</p>
              <p className="text-xs leading-relaxed text-muted">
                We only send an email when the address matches at least one workspace, and we never
                reveal whether that's the case here.
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
      description="Enter the email you use to sign in. We'll email you a list of every workspace you belong to."
      footer={
        <span>
          Don't have a workspace yet?{" "}
          <Link className="font-semibold text-foreground hover:underline" to="/sign-up">
            Create one
          </Link>
        </span>
      }
      title="Find your workspaces"
    >
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField isRequired name="email" onChange={setEmail} type="email" value={email}>
          <Label>Work email</Label>
          <Input autoComplete="email" autoFocus placeholder="you@academy.com" spellCheck={false} />
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
          Send workspace list
          <Iconify className="size-4" icon="arrow-right" />
        </Button>

        <Link className="self-center text-sm text-muted hover:text-foreground" to="/sign-in">
          I remember my workspace URL
        </Link>
      </Form>
    </AuthShell>
  );
}
