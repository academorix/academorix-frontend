/**
 * @file login-page.tsx
 * @module modules/auth/pages/login-page
 *
 * @description
 * Public login screen. Submits credentials through Refine's `useLogin`, which
 * calls the active auth provider and, on success, redirects to the dashboard.
 * Errors surface automatically via the notification provider.
 *
 * In mock mode any non-empty credentials are accepted, and a **demo persona
 * picker** lets you sign in as any of the seeded users (owner, admin, coaches,
 * reception, finance, medical) to see role-based access control in action —
 * the sidebar, action buttons, and page guards all reflect the chosen role.
 */

import { AcademicCapIcon, CheckCircleIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useLogin } from "@refinedev/core";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import type { LoginCredentials } from "@/types";
import type { FormEvent, ReactNode } from "react";

import { env } from "@/config/env";
import { siteConfig } from "@/config/site";
import { appRoutes } from "@/lib/module";

/** Credentials collected by the form (subset of {@link LoginCredentials}). */
type LoginFormValues = Pick<LoginCredentials, "email" | "password">;

/** Demo credentials pre-filled in mock mode for one-click sign-in. */
const MOCK_DEFAULTS: LoginFormValues = {
  email: "owner@academorix.test",
  password: "password",
};

/** The subset of a demo-user fixture the picker needs. */
interface DemoPersona {
  email: string;
  display_name: string;
  role: string;
}

/** Title-cases a raw role key, e.g. `"head_coach"` → `"Head Coach"`. */
function formatRole(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Flash messages the login screen shows after upstream redirects (register,
 * password reset, email verification). Keyed by the `?flash=` query param.
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

  const [email, setEmail] = useState(env.VITE_API_MOCK ? MOCK_DEFAULTS.email : "");
  const [password, setPassword] = useState(env.VITE_API_MOCK ? MOCK_DEFAULTS.password : "");
  const [personas, setPersonas] = useState<DemoPersona[]>([]);

  // In mock mode, load the demo roster so we can offer one-click role sign-in.
  useEffect(() => {
    if (!env.VITE_API_MOCK) {
      return;
    }

    let active = true;

    void (async () => {
      try {
        const response = await fetch("/data/demo-users.json");

        if (!response.ok) {
          return;
        }

        const payload: unknown = await response.json();

        if (!active || !Array.isArray(payload)) {
          return;
        }

        setPersonas(
          (
            payload as { email: string; profile?: { display_name?: string }; roles?: string[] }[]
          ).map((user) => ({
            email: user.email,
            display_name: user.profile?.display_name ?? user.email,
            role: user.roles?.[0] ?? "member",
          })),
        );
      } catch {
        // Non-fatal: the manual form still works.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    login({ email, password });
  };

  const handlePersona = (persona: DemoPersona): void => {
    setEmail(persona.email);
    setPassword("password");
    login({ email: persona.email, password: "password" });
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

              {env.VITE_API_MOCK ? (
                <Description className="text-xs">
                  Mock mode is on — any email and password will sign you in.
                </Description>
              ) : null}
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

            {env.VITE_API_MOCK && personas.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium tracking-wide text-muted uppercase">
                  Or explore a role
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {personas.map((persona) => (
                    <Button
                      key={persona.email}
                      className="justify-start"
                      isDisabled={isPending}
                      size="sm"
                      type="button"
                      variant="secondary"
                      onPress={() => handlePersona(persona)}
                    >
                      <span className="flex min-w-0 flex-col items-start">
                        <span className="truncate text-xs font-medium">{persona.display_name}</span>
                        <span className="truncate text-[10px] text-muted">
                          {formatRole(persona.role)}
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </Card.Footer>
        </Form>
      </Card>
    </main>
  );
}
