/**
 * @file verify-email-notice-page.tsx
 * @module modules/auth/pages/verify-email-notice-page
 *
 * @description
 * Protected "please verify your email" screen shown to signed-in users whose
 * `email_verified_at` is still `null`. Exposes a resend button that calls
 * `POST /api/auth/email/verification-notification` via {@link tenantAuthApi}
 * (idempotent + throttled backend-side).
 */

import { EnvelopeOpenIcon } from "@academorix/ui/icons/outline";
import { Button, Description } from "@academorix/ui/react";
import { useState } from "react";

import type { ReactNode } from "react";

import { AuthCard } from "@/modules/auth/components/auth-card";
import { tenantAuthApi } from "@/providers/auth";

/** The verify-email-notice page. */
export default function VerifyEmailNoticePage(): ReactNode {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const isMockMode = tenantAuthApi === null;

  const resend = async (): Promise<void> => {
    setError(null);

    if (isMockMode) {
      setState("sent");

      return;
    }

    setState("sending");

    try {
      await tenantAuthApi!.sendEmailVerification();
      setState("sent");
    } catch (caught) {
      setError((caught as Error).message);
      setState("idle");
    }
  };

  return (
    <AuthCard
      description="Please confirm your address so we can activate your account."
      title="Verify your email"
    >
      <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
        <EnvelopeOpenIcon aria-hidden="true" className="size-10 text-accent" />
        <p className="text-sm text-foreground">
          We sent a verification link to your inbox. Click the link to finish activating your
          account.
        </p>

        {state === "sent" ? (
          <Description className="text-success">
            A fresh verification email has been sent.
          </Description>
        ) : null}
        {error ? <Description className="text-danger">{error}</Description> : null}

        <Button
          className="w-full"
          isDisabled={state === "sending"}
          variant="secondary"
          onPress={() => void resend()}
        >
          {state === "sending" ? "Sending…" : "Resend verification email"}
        </Button>
      </div>
    </AuthCard>
  );
}
