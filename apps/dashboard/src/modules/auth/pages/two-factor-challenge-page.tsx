/**
 * @file two-factor-challenge-page.tsx
 * @module modules/auth/pages/two-factor-challenge-page
 *
 * @description
 * Post-login 2FA challenge (`/2fa/challenge?token=…`). The login endpoint
 * returns `two_factor_required: true` + a short-lived `challenge_token`; this
 * page collects the 6-digit code (or a recovery code) and posts to
 * `POST /two-factor/challenge` to redeem it in exchange for a full-abilities
 * token. Tenant-side is deferred (backend returns 501); platform-side is fully
 * functional.
 */

import { Button, Description, Form, Input, Label, Switch, TextField } from "@stackra/ui/react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "@stackra/routing/react";

import type { ApiError } from "@/lib/http";
import type { FormEvent, ReactNode } from "react";

import { deviceLabel } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { platformAuthApi } from "@/providers/auth";

/** The 2FA challenge page. */
export default function TwoFactorChallengePage(): ReactNode {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const challengeToken = params.get("token") ?? "";

  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPlatformSurface = platformAuthApi !== null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (!challengeToken) {
      setError("Missing challenge token. Please sign in again.");

      return;
    }

    if (!isPlatformSurface) {
      // Tenant 2FA is not yet implemented on the backend (returns 501); guide
      // the user to reach out to their admin.
      setError(
        "Two-factor authentication is not yet enabled on this workspace. Contact your admin.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await platformAuthApi!.challengeTwoFactor({
        challenge_token: challengeToken,
        code: useRecovery ? undefined : code,
        recovery_code: useRecovery ? recovery : undefined,
        device_name: deviceLabel(),
      });

      navigate(appRoutes.dashboard, { replace: true });
    } catch (caught) {
      const err = caught as ApiError;

      setError(err.message || "The code is invalid or expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      description="Enter the six-digit code from your authenticator app."
      title="Two-factor authentication"
    >
      <Form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 px-6 pb-2">
          {!useRecovery ? (
            <TextField
              isRequired
              inputMode="numeric"
              maxLength={6}
              name="code"
              pattern="\d{6}"
              value={code}
              onChange={setCode}
            >
              <Label>Authenticator code</Label>
              <Input placeholder="000000" variant="secondary" />
            </TextField>
          ) : (
            <TextField isRequired name="recovery_code" value={recovery} onChange={setRecovery}>
              <Label>Recovery code</Label>
              <Input placeholder="XXXX-XXXX" variant="secondary" />
            </TextField>
          )}

          <Switch isSelected={useRecovery} onChange={setUseRecovery}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Use a recovery code instead
            </Switch.Content>
          </Switch>

          {error ? <Description className="text-danger">{error}</Description> : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button className="w-full" isDisabled={isSubmitting} type="submit">
            {isSubmitting ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
