/**
 * @file sign-in-alternatives.tsx
 * @module modules/auth/components/sign-in-alternatives
 *
 * @description
 * Divider + alternative sign-in method buttons rendered below the
 * email step of the primary sign-in form. Three methods surfaced:
 *
 *   - **Passkey** — feature-detected on mount via
 *     {@link isWebAuthnSupported} + platform-authenticator check. If
 *     unsupported the button is hidden entirely so mobile browsers
 *     without WebAuthn don't see a dead affordance.
 *   - **Phone (SMS OTP)** — always available; opens the SMS OTP flow
 *     modal where the caller enters a phone + receives a code.
 *   - **SSO / SAML / OIDC** — visible when the tenant has
 *     `sso_enabled` on `Identity.features` **and** the caller is on a
 *     tenant subdomain (so we have a slug to POST to the initiate
 *     endpoint). Single-IdP tenants redirect immediately; multi-IdP
 *     tenants open a picker modal.
 *
 * ## Composition
 *
 * The component is pure UI — it delegates the actual sign-in wiring
 * (token persistence, redirect) to the parent via `onSignedIn`. That
 * keeps the state machine in `sign-in.tsx` and lets this component
 * stay small + testable.
 */

import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  toast,
} from "@heroui/react";
import { useList } from "@refinedev/core";
import { useEffect, useMemo, useState } from "react";

import type { BaseRecord } from "@refinedev/core";
import type { FormEvent, ReactNode } from "react";
import type { LoginResult, SsoInitiateResult } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import {
  isPlatformAuthenticatorAvailable,
  isWebAuthnSupported,
  signInWithPasskey,
} from "@/lib/auth/webauthn";
import { FEATURE_KEYS, useHasFeature } from "@/refine/identity-store";

export interface SignInAlternativesProps {
  /** Callback invoked with the raw login result on a successful alt-method sign-in. */
  onSignedIn: (result: LoginResult) => void | Promise<void>;
  /** Optional email hint — passed to the passkey call to narrow allowCredentials. */
  emailHint?: string;
  /**
   * The current tenant slug — required to POST to the SSO initiate
   * endpoint. Absent (central-host visitors) hides the SSO button
   * entirely because there's no tenant scope to initiate against.
   */
  tenantSlug?: string;
}

/**
 * A single row from `identity-providers` — the shape our fixture +
 * backend both project. Kept local to this component because it's
 * the only consumer at this point; the settings SSO page will
 * introduce its own richer type when Task 28 lands.
 */
interface IdentityProviderRow extends BaseRecord {
  id: string;
  name: string;
  protocol: "saml" | "oidc";
  emailDomain: string;
  isPrimary: boolean;
  logoUrl?: string | null;
}

/**
 * Alternative sign-in dividers + buttons + the SMS OTP modal.
 * Rendered below the email step of the primary form.
 */
export function SignInAlternatives({
  onSignedIn,
  emailHint,
  tenantSlug,
}: SignInAlternativesProps): ReactNode {
  const [supportsPasskey, setSupportsPasskey] = useState<boolean>(false);
  const [isPasskeyRunning, setPasskeyRunning] = useState<boolean>(false);
  const [smsOpen, setSmsOpen] = useState<boolean>(false);
  const [ssoRunning, setSsoRunning] = useState<boolean>(false);
  const [ssoPickerOpen, setSsoPickerOpen] = useState<boolean>(false);

  const ssoEnabled = useHasFeature(FEATURE_KEYS.SSO_ENABLED);
  const showSso = ssoEnabled && Boolean(tenantSlug);

  // Only load the identity-providers fixture when the SSO button is
  // actually going to render — no reason to burn a request on
  // tenants that haven't enrolled a single IdP. Refine caches the
  // result so opening the picker modal is a no-op refetch.
  const { result: idpResult } = useList<IdentityProviderRow>({
    resource: "identity-providers",
    pagination: { mode: "off" },
    queryOptions: { enabled: showSso },
  });

  const idps: IdentityProviderRow[] = useMemo(
    () => (idpResult?.data ?? []) as IdentityProviderRow[],
    [idpResult?.data],
  );

  // Primary IdP first, then everything else. The picker leans on
  // this ordering to render the "Recommended" badge on the correct
  // row without a second sort.
  const orderedIdps: IdentityProviderRow[] = useMemo(() => {
    const primary = idps.find((idp) => idp.isPrimary);
    const rest = idps.filter((idp) => !idp.isPrimary);

    return primary ? [primary, ...rest] : rest;
  }, [idps]);

  useEffect(() => {
    if (!isWebAuthnSupported()) return;

    void isPlatformAuthenticatorAvailable().then(setSupportsPasskey);
  }, []);

  const handlePasskey = async (): Promise<void> => {
    setPasskeyRunning(true);

    try {
      const result = await signInWithPasskey(emailHint);

      await onSignedIn(result);
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error && caught.name === "NotAllowedError"
            ? "Passkey sign-in was cancelled."
            : "We couldn't sign you in with a passkey.";

      toast.danger(message);
    } finally {
      setPasskeyRunning(false);
    }
  };

  /**
   * Fire the initiate call for a specific IdP and redirect the
   * browser to whichever URL the backend returned (SAML → `sso_url`,
   * OIDC → `authorization_url`). Extracted as a helper so the
   * one-IdP fast path and the modal-picker row-click path share the
   * same failure semantics.
   */
  const initiateSso = async (idp: IdentityProviderRow): Promise<void> => {
    if (!tenantSlug) return;

    setSsoRunning(true);

    try {
      const result: SsoInitiateResult = await authApi.ssoInitiate(tenantSlug, idp.protocol, idp.id);
      const redirectUrl = result.sso_url ?? result.authorization_url;

      if (!redirectUrl) {
        toast.danger("Your identity provider didn't return a sign-in URL.");
        setSsoRunning(false);

        return;
      }

      // Full page redirect — see the note in `sign-in.tsx`'s
      // `handleEmailSubmit`. The `/sso/callback` route picks up the
      // return leg.
      window.location.assign(redirectUrl);
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't start SSO sign-in. Please try again.";

      toast.danger(message);
      setSsoRunning(false);
    }
  };

  /**
   * Entry point from the "Continue with SSO" button. Fast-paths a
   * single-IdP tenant to skip the picker; otherwise opens the modal
   * so the caller chooses which IdP to sign in with.
   */
  const handleSso = async (): Promise<void> => {
    if (!tenantSlug || ssoRunning) return;

    if (orderedIdps.length === 0) {
      // Feature flag says SSO is enabled but the fixture is empty —
      // shouldn't happen in a healthy tenant, but a broken config
      // shouldn't drop a silent affordance either.
      toast.danger("No identity providers are configured for this workspace. Contact your admin.");

      return;
    }

    if (orderedIdps.length === 1) {
      await initiateSso(orderedIdps[0]!);

      return;
    }

    setSsoPickerOpen(true);
  };

  // Nothing to render if neither method is available.
  if (!supportsPasskey) {
    return (
      <>
        <MethodDivider label="or" />
        <div className="flex flex-col gap-2">
          <Button fullWidth onPress={() => setSmsOpen(true)} type="button" variant="secondary">
            <Iconify className="size-4" icon="message-square" />
            Sign in with a phone number
          </Button>
          {showSso ? (
            <Button
              fullWidth
              isPending={ssoRunning}
              onPress={handleSso}
              type="button"
              variant="secondary"
            >
              <Iconify className="size-4" icon="shield-check" />
              Continue with SSO
            </Button>
          ) : null}
        </div>
        <SmsOtpModal isOpen={smsOpen} onClose={() => setSmsOpen(false)} onSignedIn={onSignedIn} />
        {showSso ? (
          <SsoIdpPickerModal
            idps={orderedIdps}
            isOpen={ssoPickerOpen}
            isSubmitting={ssoRunning}
            onClose={() => setSsoPickerOpen(false)}
            onSelect={initiateSso}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <MethodDivider label="or" />
      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          isPending={isPasskeyRunning}
          onPress={handlePasskey}
          type="button"
          variant="secondary"
        >
          <Iconify className="size-4" icon="key" />
          Sign in with a passkey
        </Button>
        <Button fullWidth onPress={() => setSmsOpen(true)} type="button" variant="secondary">
          <Iconify className="size-4" icon="message-square" />
          Sign in with a phone number
        </Button>
        {showSso ? (
          <Button
            fullWidth
            isPending={ssoRunning}
            onPress={handleSso}
            type="button"
            variant="secondary"
          >
            <Iconify className="size-4" icon="shield-check" />
            Continue with SSO
          </Button>
        ) : null}
      </div>
      <SmsOtpModal isOpen={smsOpen} onClose={() => setSmsOpen(false)} onSignedIn={onSignedIn} />
      {showSso ? (
        <SsoIdpPickerModal
          idps={orderedIdps}
          isOpen={ssoPickerOpen}
          isSubmitting={ssoRunning}
          onClose={() => setSsoPickerOpen(false)}
          onSelect={initiateSso}
        />
      ) : null}
    </>
  );
}

/** "or" divider — hairline with a centred label. */
function MethodDivider({ label }: { label: string }): ReactNode {
  return (
    <div className="my-2 flex items-center gap-3 text-xs tracking-[0.14em] text-muted uppercase">
      <span className="h-px flex-1 bg-border/60" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SMS OTP modal — two-step: phone → code
// ---------------------------------------------------------------------------

type SmsStage = "phone" | "code";

function SmsOtpModal({
  isOpen,
  onClose,
  onSignedIn,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSignedIn: (result: LoginResult) => void | Promise<void>;
}): ReactNode {
  const [stage, setStage] = useState<SmsStage>("phone");
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reset = (): void => {
    setStage("phone");
    setPhone("");
    setCode("");
    setError(null);
  };

  const handleRequest = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!phone.trim()) {
      setError("Enter your phone number to continue.");

      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await authApi.phoneOtpRequest({ phone });
      setStage("code");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't send the code. Check the number and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!code.trim()) return;

    setError(null);
    setSubmitting(true);

    try {
      const result = await authApi.phoneOtpLogin({
        phone,
        code,
        device_name: "Web session (SMS)",
      });

      await onSignedIn(result);
      onClose();
      reset();
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

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
            reset();
          }
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {stage === "phone" ? "Sign in with a phone number" : "Enter the code we sent"}
              </Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                {stage === "phone"
                  ? "We'll send a 6-digit code to your phone. Use the international format."
                  : `Code sent to ${phone}.`}
              </p>
            </Modal.Header>
            <Modal.Body>
              {stage === "phone" ? (
                <Form className="flex flex-col gap-3" onSubmit={handleRequest}>
                  <TextField
                    isDisabled={isSubmitting}
                    isRequired
                    name="phone"
                    onChange={setPhone}
                    type="tel"
                    value={phone}
                  >
                    <Label>Phone number</Label>
                    <Input autoComplete="tel" autoFocus placeholder="+1 555 555 5555" />
                    <Description>Include the country code, e.g. +1, +44, +966.</Description>
                    {error ? <FieldError>{error}</FieldError> : null}
                  </TextField>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      isDisabled={isSubmitting}
                      onPress={() => {
                        onClose();
                        reset();
                      }}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button isPending={isSubmitting} type="submit" variant="primary">
                      Send code
                    </Button>
                  </div>
                </Form>
              ) : (
                <Form className="flex flex-col gap-3" onSubmit={handleLogin}>
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
                    {error ? <FieldError>{error}</FieldError> : null}
                  </TextField>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      isDisabled={isSubmitting}
                      onPress={() => setStage("phone")}
                      type="button"
                      variant="secondary"
                    >
                      Change number
                    </Button>
                    <Button isPending={isSubmitting} type="submit" variant="primary">
                      Sign in
                    </Button>
                  </div>
                </Form>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SSO IdP picker modal — multi-IdP tenants only
// ---------------------------------------------------------------------------

/**
 * Lightweight picker rendered when a tenant has more than one
 * `TenantIdentityProvider` enrolled. Each row shows the IdP's name +
 * logo (falls back to a generic building glyph when no logo is set)
 * and a small "Recommended" badge on the primary IdP so a caller
 * with several enrolments can pick the one they use every day
 * without reading the whole list.
 *
 * Clicking a row fires `onSelect`, which calls the parent's
 * `initiateSso(idp)` — the parent owns the redirect + failure toast
 * so we don't need to duplicate that logic here.
 */
function SsoIdpPickerModal({
  idps,
  isOpen,
  isSubmitting,
  onClose,
  onSelect,
}: {
  idps: IdentityProviderRow[];
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSelect: (idp: IdentityProviderRow) => void | Promise<void>;
}): ReactNode {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Choose an identity provider</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Sign in with the provider your workspace uses. Recommended is the one your admin
                marked as primary.
              </p>
            </Modal.Header>
            <Modal.Body>
              <ul className="flex flex-col gap-2" role="list">
                {idps.map((idp) => (
                  <li key={idp.id}>
                    <button
                      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-start transition-colors hover:bg-surface-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                      onClick={() => {
                        void onSelect(idp);
                      }}
                      type="button"
                    >
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface p-1.5 ring-1 ring-border"
                      >
                        {idp.logoUrl ? (
                          <img alt="" className="size-full object-contain" src={idp.logoUrl} />
                        ) : (
                          <Iconify className="size-5 text-muted" icon="shield-check" />
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <span className="truncate">{idp.name}</span>
                          {idp.isPrimary ? (
                            <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                              Recommended
                            </span>
                          ) : null}
                        </span>
                        <span className="truncate text-xs tracking-wide text-muted uppercase">
                          {idp.protocol}
                        </span>
                      </span>
                      <Iconify className="size-4 shrink-0 text-muted" icon="arrow-right" />
                    </button>
                  </li>
                ))}
              </ul>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
