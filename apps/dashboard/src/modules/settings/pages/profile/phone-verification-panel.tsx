/**
 * @file phone-verification-panel.tsx
 * @module modules/settings/pages/profile/phone-verification-panel
 *
 * @description
 * Add + verify the current caller's phone number. Two-step flow:
 *
 *   1. Enter phone → server sends a 6-digit SMS code
 *      (`POST /api/auth/phone/verify/request`).
 *   2. Enter code → server marks the phone as verified
 *      (`POST /api/auth/phone/verify/confirm`).
 *
 * ## Backend contract
 *
 * The endpoints are authenticated (`auth:sanctum` + `tenant.user`) —
 * every request carries the current Sanctum token. The
 * phone number is persisted on the caller's User model server-side;
 * this panel doesn't need to POST it to any profile endpoint
 * separately.
 *
 * ## UX
 *
 * The panel exposes three visual states:
 *   - `add` — no verified phone yet, plain "Add your phone" form.
 *   - `verify` — code entry, "Resend" affordance, "Change number" back-link.
 *   - `verified` — done. Shows the masked phone + "Replace" button
 *     that resets to the `add` state.
 *
 * State is fully local — a page reload re-runs the identity fetch
 * which now includes `phone_verified_at` when available, so returning
 * users land on the `verified` state without re-verifying.
 */

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";

import type { FormEvent, ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";

type ViewState = "add" | "verify" | "verified";

interface PhoneVerificationPanelProps {
  /** Initial phone number when the caller already has one on file. */
  initialPhone?: string | null;
  /** Whether the initial phone is already verified. */
  initialIsVerified?: boolean;
}

export function PhoneVerificationPanel({
  initialPhone,
  initialIsVerified,
}: PhoneVerificationPanelProps = {}): ReactNode {
  const [state, setState] = useState<ViewState>(initialIsVerified ? "verified" : "add");
  const [phone, setPhone] = useState<string>(initialPhone ?? "");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [isResending, setResending] = useState<boolean>(false);

  const handleRequest = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!phone.trim()) {
      setFieldErrors({ phone: "Enter a phone number to continue." });

      return;
    }

    setSubmitting(true);

    try {
      await authApi.phoneVerificationRequest({ phone });
      setState("verify");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setError(caught.message);

        return;
      }

      setError("We couldn't send the code. Check the number and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!code.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      await authApi.phoneVerificationConfirm({ code });
      setState("verified");
      setCode("");
      toast.success("Phone number verified");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "That code didn't match. Try again or request a new one.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    setResending(true);
    try {
      await authApi.phoneVerificationRequest({ phone });
      toast.success("New code sent", { description: `Check ${phone} in a minute.` });
    } catch (caught) {
      toast.danger(caught instanceof ApiError ? caught.message : "We couldn't resend the code.");
    } finally {
      setResending(false);
    }
  };

  const handleReplace = (): void => {
    setState("add");
    setPhone("");
    setCode("");
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Phone number</h3>
        <p className="text-sm text-muted">
          A verified phone unlocks SMS sign-in, SMS password reset, and safeguarding-safe contact
          for on-call staff.
        </p>
      </div>

      {state === "verified" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
            <Iconify className="size-5" icon="circle-check" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="font-medium text-foreground">Verified</p>
            <p className="truncate text-xs text-muted">{phone || "Number on file"}</p>
          </div>
          <Button onPress={handleReplace} size="sm" variant="secondary">
            Replace number
          </Button>
        </div>
      ) : null}

      {state === "add" ? (
        <Form className="flex flex-col gap-4" onSubmit={handleRequest}>
          <TextField
            isDisabled={isSubmitting}
            isInvalid={Boolean(fieldErrors.phone)}
            isRequired
            name="phone"
            onChange={setPhone}
            type="tel"
            value={phone}
          >
            <Label>Phone number</Label>
            <Input autoComplete="tel" autoFocus placeholder="+1 555 555 5555" />
            <Description>Use the international format, e.g. +1, +44, +966.</Description>
            {fieldErrors.phone ? <FieldError>{fieldErrors.phone}</FieldError> : null}
          </TextField>

          {error ? (
            <div
              aria-live="polite"
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button isPending={isSubmitting} type="submit" variant="primary">
              <Iconify className="size-4" icon="paper-plane" />
              Send verification code
            </Button>
          </div>
        </Form>
      ) : null}

      {state === "verify" ? (
        <Form className="flex flex-col gap-4" onSubmit={handleConfirm}>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Iconify className="size-4 shrink-0 text-muted" icon="mobile" />
              <span className="truncate text-sm text-foreground">{phone}</span>
            </div>
            <button
              className="text-xs text-muted hover:text-foreground"
              onClick={() => setState("add")}
              type="button"
            >
              Change number
            </button>
          </div>

          <TextField
            isDisabled={isSubmitting}
            isRequired
            maxLength={6}
            name="code"
            onChange={setCode}
            value={code}
          >
            <Label>Verification code</Label>
            <Input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              placeholder="123456"
              spellCheck={false}
            />
            <Description>Enter the 6-digit code we sent to your phone.</Description>
          </TextField>

          {error ? (
            <div
              aria-live="polite"
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              isDisabled={isSubmitting}
              isPending={isResending}
              onPress={handleResend}
              type="button"
              variant="secondary"
            >
              Resend code
            </Button>
            <Button isPending={isSubmitting} type="submit" variant="primary">
              Verify + save
            </Button>
          </div>
        </Form>
      ) : null}
    </div>
  );
}
