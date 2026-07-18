/**
 * @file login-page.tsx
 * @module modules/auth/pages/login-page
 *
 * @description
 * Public login screen. Submits credentials through Refine's {@code useLogin},
 * which calls the active auth provider (platform on the admin host, tenant
 * everywhere else) and, on success, redirects to the dashboard. Errors
 * surface automatically via the notification provider.
 *
 * The multi-persona demo picker that used to live here was removed
 * alongside the mock data layer — the page now targets the real Sanctum
 * backend exclusively.
 */

import { AcademicCapIcon, CheckCircleIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Card, Form, Input, Label, TextField } from "@stackra/ui/react";
import { useLogin } from "@refinedev/core";
import { useState } from "react";
import { Link, useSearchParams } from "@stackra/routing/react";

import type { LoginCredentials } from "@/types";
import type { FormEvent, ReactNode } from "react";

import { siteConfig } from "@/config/site.config";
import { appRoutes } from "@/lib/module";

/** Credentials collected by the form (subset of {@link LoginCredentials}). */
type LoginFormValues = Pick<LoginCredentials, "email" | "password">;

/**
 * Flash messages the login screen shows after upstream redirects (register,
 * password reset, email verification). Keyed by the {@code ?flash=} query
 * param.
 */
const FLASH_MESSAGES: Record<string, string> = {
  "check-email": "Account created. Check your email to verify your address, then sign in.",
  "password-reset": "Password updated. Sign in with your new password.",
  "email-verified": "Email verified. You can sign in now.",
  "session-expired": "Your session expired. Please sign in again.",
};

/** Renders the login card and wires submission to Refine's auth flow. */
export default function LoginPage(): ReactNode {
  const { mutate: login, isPending } = useLogin<LoginFormValues>();
  const [params] = useSearchParams();
  const flash = params.get("flash");
  const flashMessage = flash ? FLASH_MESSAGES[flash] : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    login({ email, password });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <AcademicCapIcon aria-hidden="true" className="size-7" />
            <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
          </div>
          <Card.Title>Sign in</Card.Title>
          <Card.Description>Access your academy dashboard.</Card.Description>
        </Card.Header>

        <Form onSubmit={handleSubmit}>
          <Card.Content>
            <div className="flex flex-col gap-4">
              {flashMessage ? (
                <div
                  className="flex items-start gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
                  role="status"
                >
                  <CheckCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{flashMessage}</span>
                </div>
              ) : null}

              <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
                <Label>Email</Label>
                <Input placeholder="you@academy.com" variant="secondary" />
              </TextField>

              <TextField
                isRequired
                name="password"
                type="password"
                value={password}
                onChange={setPassword}
              >
                <Label>Password</Label>
                <Input placeholder="••••••••" variant="secondary" />
              </TextField>
            </div>
          </Card.Content>

          <Card.Footer className="mt-4 flex-col items-stretch gap-4">
            <Button className="w-full" isDisabled={isPending} type="submit">
              {isPending ? "Signing in…" : "Sign in"}
            </Button>

            <div className="flex justify-between text-xs text-muted">
              <Link className="hover:text-foreground" to={appRoutes.forgotPassword}>
                Forgot password?
              </Link>
              <Link className="hover:text-foreground" to={appRoutes.register}>
                Create an account
              </Link>
            </div>
          </Card.Footer>
        </Form>
      </Card>
    </main>
  );
}
