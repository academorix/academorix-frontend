/**
 * @file find-workspaces-form.tsx
 * @module components/onboarding/find-workspaces-form
 *
 * @description
 * Interactive form behind `/find-workspaces`. Client Component; receives
 * `site` from the Server Component parent.
 */

"use client";

import { EnvelopeIcon, MagnifyingGlassIcon } from "@academorix/ui/icons/outline";
import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useState } from "react";

import type { SiteData } from "@/lib/types";
import type { FormEvent, ReactNode } from "react";

import { AuthCard } from "@/components/auth-card";
import { Link } from "@/i18n/navigation";
import { MarketingApiError, postJson } from "@/lib/api-client/http";

/** Discriminated union of the possible form states. */
type FormState = "idle" | "submitting" | "sent";

/** Props for {@link FindWorkspacesForm}. */
interface FindWorkspacesFormProps {
  site: SiteData;
}

/** The find-workspaces form. */
export function FindWorkspacesForm({ site }: FindWorkspacesFormProps): ReactNode {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setState("submitting");

    try {
      await postJson<null>("/v1/auth/find-workspaces", { email });
    } catch (caught) {
      if (caught instanceof MarketingApiError && caught.status === 0) {
        setError(caught.message);
        setState("idle");

        return;
      }
    }

    setState("sent");
  };

  return (
    <AuthCard
      description="Enter the email you used and we'll send you the workspaces you belong to."
      footer={
        <p className="text-center text-sm text-muted">
          Need a new workspace?{" "}
          <Link className="text-accent hover:underline" href="/create-workspace">
            Create one
          </Link>
        </p>
      }
      site={site}
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
