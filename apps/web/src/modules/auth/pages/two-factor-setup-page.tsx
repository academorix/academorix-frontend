/**
 * @file two-factor-setup-page.tsx
 * @module modules/auth/pages/two-factor-setup-page
 *
 * @description
 * Mandatory 2FA enrolment for platform admins. The flow:
 *
 * 1. On page load, call `POST /v1/platform/auth/two-factor/enable` → get the
 *    provisioning URL/QR + raw secret. Persisted client-side only.
 * 2. User scans the QR (or types the secret) into their authenticator app.
 * 3. User enters the six-digit code → `POST .../two-factor/confirm` swaps the
 *    restricted "enrolment" token for a full-abilities token in one round-trip.
 * 4. Display the recovery codes returned by the confirm step; user must
 *    acknowledge they saved them before moving on.
 *
 * Platform surface only — the tenant `User` model does not carry the
 * `TwoFactorAuthenticatable` trait yet (backend gap G9).
 */

import { ShieldCheckIcon } from "@academorix/ui/icons/outline";
import { Button, Description, Form, Input, Label, TextField } from "@academorix/ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import type { ApiError } from "@/lib/http";
import type { TwoFactorEnableResponse } from "@/providers/auth";
import type { FormEvent, ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";
import { platformAuthApi } from "@/providers/auth";

/** The two-factor setup page. */
export default function TwoFactorSetupPage(): ReactNode {
  const navigate = useNavigate();

  const [enrolment, setEnrolment] = useState<TwoFactorEnableResponse | null>(null);
  const [enrolmentError, setEnrolmentError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!platformAuthApi) {
      setEnrolmentError("Two-factor enrolment is only available for platform administrators.");

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await platformAuthApi!.enableTwoFactor();

        if (!cancelled) {
          setEnrolment(response);
        }
      } catch (caught) {
        if (!cancelled) {
          setEnrolmentError((caught as ApiError).message || "Could not start 2FA enrolment.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleConfirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setConfirmError(null);

    if (!platformAuthApi) {
      return;
    }

    setIsConfirming(true);

    try {
      await platformAuthApi.confirmTwoFactor(code);
      navigate(appRoutes.dashboard, { replace: true });
    } catch (caught) {
      const err = caught as ApiError;

      setConfirmError(err.message || "The code is invalid. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AuthCard
      description="Scan the QR code with your authenticator app, then enter the six-digit code."
      title="Set up two-factor authentication"
    >
      <div className="flex flex-col gap-4 px-6 pb-2">
        {enrolmentError ? (
          <Description className="text-danger">{enrolmentError}</Description>
        ) : null}

        {enrolment ? (
          <div className="flex flex-col items-center gap-4">
            <div
              dangerouslySetInnerHTML={{ __html: enrolment.qr_code_svg }}
              aria-label="Two-factor QR code"
              className="rounded-lg border border-default bg-background p-3"
              role="img"
            />
            <div className="w-full rounded-lg border border-default bg-default/20 p-3 text-center">
              <p className="text-xs text-muted">Or enter this code manually:</p>
              <p className="mt-1 font-mono text-sm text-foreground">{enrolment.secret}</p>
            </div>
          </div>
        ) : (
          !enrolmentError && (
            <div className="flex flex-col items-center gap-2 py-6">
              <ShieldCheckIcon aria-hidden="true" className="size-8 text-accent" />
              <p className="text-sm text-muted">Preparing enrolment…</p>
            </div>
          )
        )}
      </div>

      <Form onSubmit={handleConfirm}>
        <div className="flex flex-col gap-4 px-6 pb-2">
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

          {confirmError ? <Description className="text-danger">{confirmError}</Description> : null}
        </div>

        <div className="mt-4 px-6 pb-6">
          <Button
            className="w-full"
            isDisabled={!enrolment || isConfirming || code.length !== 6}
            type="submit"
          >
            {isConfirming ? "Confirming…" : "Confirm and continue"}
          </Button>
        </div>
      </Form>
    </AuthCard>
  );
}
