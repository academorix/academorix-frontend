/**
 * @file login-page.tsx
 * @module modules/auth/pages/login-page
 *
 * @description
 * Public login screen. Submits credentials through Refine's `useLogin`, which
 * calls the active auth provider and, on success, redirects to the dashboard.
 * Errors surface automatically via the notification provider.
 *
 * In mock mode any non-empty credentials are accepted; the form is pre-filled
 * with a demo account and a hint is shown so that is obvious.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useLogin } from "@refinedev/core";
import { useState } from "react";

import type { LoginCredentials } from "@/types";
import type { FormEvent, ReactNode } from "react";

import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

/** Credentials collected by the form (subset of {@link LoginCredentials}). */
type LoginFormValues = Pick<LoginCredentials, "email" | "password">;

/** Demo credentials pre-filled in mock mode for one-click sign-in. */
const MOCK_DEFAULTS: LoginFormValues = {
  email: "owner@academorix.test",
  password: "password",
};

/** Renders the login card and wires submission to Refine's auth flow. */
export default function LoginPage(): ReactNode {
  const { mutate: login, isPending } = useLogin<LoginFormValues>();

  const [email, setEmail] = useState(env.VITE_API_MOCK ? MOCK_DEFAULTS.email : "");
  const [password, setPassword] = useState(env.VITE_API_MOCK ? MOCK_DEFAULTS.password : "");

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

              {env.VITE_API_MOCK ? (
                <Description className="text-xs">
                  Mock mode is on — any email and password will sign you in.
                </Description>
              ) : null}
            </div>
          </Card.Content>

          <Card.Footer className="mt-4">
            <Button className="w-full" isDisabled={isPending} type="submit">
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </Card.Footer>
        </Form>
      </Card>
    </main>
  );
}
