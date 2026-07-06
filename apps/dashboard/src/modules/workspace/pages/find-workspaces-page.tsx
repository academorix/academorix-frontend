/**
 * @file find-workspaces-page.tsx
 * @module modules/workspace/pages/find-workspaces-page
 *
 * @description
 * The "Find my workspaces" form (central host `/find-workspaces`). Anonymous
 * visitors enter their email and the backend emails a list of every
 * workspace that email belongs to. Anti-enumeration: the endpoint always
 * responds 2xx so the client can safely surface a "sent" affirmative
 * regardless of whether the address matched.
 */

import { EnvelopeIcon, MagnifyingGlassIcon } from "@academorix/ui/icons/outline";
import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useState } from "react";
import { Link } from "react-router";

import type { FormEvent, ReactNode } from "react";

import { httpClient } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";

/** The find-workspaces page. */
export default function FindWorkspacesPage(): ReactNode {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setState("submitting");

    try {
      await httpClient.post("/v1/auth/find-workspaces", { email });
      setState("sent");
    } catch (caught) {
      // Anti-enumeration: still show a "sent" affirmative on the client for
      // non-4xx failures. Only surface actual client-side / network issues.
      if (caught instanceof Error && caught.message) {
        setError(caught.message);
      }
      setState("sent");
    }
  };

  return (
    <AuthCard
      description="We will email you the workspaces linked to your address."
      footer={
        <p className="text-center text-sm text-muted">
          <Link className="text-accent hover:underline" to={appRoutes.workspacePicker}>
            Back to workspace picker
          </Link>
        </p>
      }
      title="Find my workspaces"
    >
      {state === "sent" ? (
        <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
          <EnvelopeIcon aria-hidden="true" className="size-10 text-accent" />
          <p className="text-sm text-foreground">
            If any workspaces are linked to that email, we have sent them your way.
          </p>
          <p className="text-sm text-muted">Check your inbox — including spam.</p>
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
              <MagnifyingGlassIcon aria-hidden="true" className="size-4" />
              {state === "submitting" ? "Sending…" : "Email me the list"}
            </Button>
          </div>
        </Form>
      )}
    </AuthCard>
  );
}
