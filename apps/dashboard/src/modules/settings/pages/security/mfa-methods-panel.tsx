/**
 * @file mfa-methods-panel.tsx
 * @module modules/settings/pages/security/mfa-methods-panel
 *
 * @description
 * Two-factor authentication management. Lists the caller's enrolled
 * methods (TOTP / SMS / Passkey), lets them add a new one with the
 * appropriate enrolment wizard, promote a method to primary, and
 * remove a method. Every destructive operation is gated by the
 * shared {@link usePasswordConfirm} modal.
 *
 * ## Add flows
 *
 *   - **TOTP** — server returns `secret` + `otpauth_url` on
 *     enrolment. The panel renders a QR code + the base32 secret
 *     for manual entry, then asks for the 6-digit code to verify.
 *   - **Passkey** — routes through the WebAuthn browser API via
 *     {@link registerPasskey}. Server handles attestation.
 *   - **SMS** — collects a phone number, server sends a code, the
 *     panel asks for the code to verify. (Requires SMS delivery to
 *     be configured on the backend — the panel falls back to a
 *     clean error message when the enrolment 501s.)
 */

import {
  Button,
  Chip,
  Description,
  Dropdown,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import type { FormEvent, ReactNode } from "react";
import type { MfaMethodEntry, TotpEnrollmentResponse } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import {
  isPlatformAuthenticatorAvailable,
  isWebAuthnSupported,
  registerPasskey,
} from "@/lib/auth/webauthn";
import { usePasswordConfirm } from "@/hooks/use-password-confirm";

// ---------------------------------------------------------------------------
// Icons + copy per method
// ---------------------------------------------------------------------------

const METHOD_META: Record<
  MfaMethodEntry["method"],
  { icon: string; label: string; description: string }
> = {
  totp: {
    icon: "mobile",
    label: "Authenticator app",
    description: "6-digit code from Authy, 1Password, Google Authenticator, or similar.",
  },
  sms: {
    icon: "message-square",
    label: "SMS text",
    description: "A code sent to your phone number every time you sign in.",
  },
  email: {
    icon: "envelope",
    label: "Email code",
    description: "A code emailed to your address at sign-in.",
  },
  webauthn: {
    icon: "key",
    label: "Passkey",
    description: "Phone-native biometrics or a hardware security key.",
  },
};

// ---------------------------------------------------------------------------
// Enrolment wizard state
// ---------------------------------------------------------------------------

type AddState =
  | { stage: "idle" }
  | { stage: "picker" }
  | { stage: "totp-enrol"; enrolment: TotpEnrollmentResponse }
  | { stage: "sms-request" }
  | { stage: "sms-verify"; method: MfaMethodEntry };

export function MfaMethodsPanel(): ReactNode {
  const [methods, setMethods] = useState<readonly MfaMethodEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [add, setAdd] = useState<AddState>({ stage: "idle" });
  const [supportsPasskey, setSupportsPasskey] = useState<boolean>(false);
  const [isPasskeyRegistering, setPasskeyRegistering] = useState<boolean>(false);
  const [primaryPending, setPrimaryPending] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const confirmPassword = usePasswordConfirm();

  const reload = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { methods: next } = await authApi.listMfaMethods();

      setMethods(next);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "We couldn't load your two-factor methods.",
      );
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Feature-detect passkey support once. WebAuthn support requires
  // both `PublicKeyCredential` on window + a platform authenticator
  // (Touch ID / Windows Hello / Android biometric).
  useEffect(() => {
    if (!isWebAuthnSupported()) return;

    void isPlatformAuthenticatorAvailable().then(setSupportsPasskey);
  }, []);

  const handleAddPasskey = async (): Promise<void> => {
    setAdd({ stage: "idle" });
    setPasskeyRegistering(true);

    try {
      await registerPasskey("Passkey · " + new Date().toISOString().slice(0, 10));
      toast.success("Passkey added");
      await reload();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error && caught.name === "InvalidStateError"
            ? "This device is already enrolled. Try a different device."
            : "We couldn't add that passkey. Try again.";

      toast.danger(message);
    } finally {
      setPasskeyRegistering(false);
    }
  };

  const handleAddTotp = async (): Promise<void> => {
    try {
      const enrolment = await authApi.createMfaMethod({ method: "totp" });

      setAdd({ stage: "totp-enrol", enrolment });
    } catch (caught) {
      toast.danger(
        caught instanceof ApiError ? caught.message : "We couldn't start authenticator enrolment.",
      );
    }
  };

  const handleSetPrimary = async (method: MfaMethodEntry): Promise<void> => {
    const ok = await confirmPassword({
      title: "Set as primary?",
      description: `We'll use ${METHOD_META[method.method].label} first every time you sign in.`,
      confirmLabel: "Set as primary",
      icon: "star",
    });

    if (!ok) return;

    setPrimaryPending(method.id);

    try {
      await authApi.setPrimaryMfaMethod(method.id);
      toast.success("Primary method updated");
      await reload();
    } catch (caught) {
      toast.danger(
        caught instanceof ApiError ? caught.message : "We couldn't update your primary method.",
      );
    } finally {
      setPrimaryPending(null);
    }
  };

  const handleDelete = async (method: MfaMethodEntry): Promise<void> => {
    const ok = await confirmPassword({
      title: `Remove ${METHOD_META[method.method].label}?`,
      description: "This method won't be available at sign-in until you re-enrol it.",
      confirmLabel: "Remove",
      variant: "danger",
      icon: "trash-bin",
    });

    if (!ok) return;

    setDeletePending(method.id);

    try {
      await authApi.deleteMfaMethod(method.id);
      toast.success("Method removed");
      await reload();
    } catch (caught) {
      toast.danger(caught instanceof ApiError ? caught.message : "We couldn't remove that method.");
    } finally {
      setDeletePending(null);
    }
  };

  if (methods === null && !error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner color="accent" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
        <Iconify className="mt-0.5 size-5 shrink-0 text-danger" icon="triangle-exclamation" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">Couldn't load methods</p>
          <p className="text-xs text-muted">{error}</p>
        </div>
        <Button className="ms-auto" onPress={reload} size="sm" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const list = methods ?? [];
  const hasAny = list.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">Two-factor authentication</h3>
          <p className="text-sm text-muted">
            Add a second step at sign-in — a passkey, an authenticator code, or a text message.
          </p>
        </div>
        <AddMethodMenu
          isPasskeyRegistering={isPasskeyRegistering}
          onAddPasskey={handleAddPasskey}
          onAddSms={() => setAdd({ stage: "sms-request" })}
          onAddTotp={handleAddTotp}
          supportsPasskey={supportsPasskey}
        />
      </div>

      {hasAny ? (
        <ul className="flex flex-col gap-2">
          {list.map((method) => {
            const meta = METHOD_META[method.method];

            return (
              <li
                key={method.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 sm:items-center sm:gap-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-foreground">
                  <Iconify className="size-5" icon={meta.icon} />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {method.label || meta.label}
                    </span>
                    {method.is_primary ? (
                      <Chip color="accent" size="sm" variant="soft">
                        <Chip.Label>Primary</Chip.Label>
                      </Chip>
                    ) : null}
                    {method.is_verified ? null : (
                      <Chip color="warning" size="sm" variant="soft">
                        <Chip.Label>Unverified</Chip.Label>
                      </Chip>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                    <span>{meta.description}</span>
                    {method.phone_masked ? <span>· {method.phone_masked}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {method.is_verified && !method.is_primary ? (
                    <Button
                      isPending={primaryPending === method.id}
                      onPress={() => handleSetPrimary(method)}
                      size="sm"
                      variant="secondary"
                    >
                      Make primary
                    </Button>
                  ) : null}
                  <Button
                    aria-label="Remove method"
                    isIconOnly
                    isPending={deletePending === method.id}
                    onPress={() => handleDelete(method)}
                    size="sm"
                    variant="ghost"
                  >
                    <Iconify className="size-4" icon="trash-bin" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-secondary/40 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Iconify className="size-5" icon="shield-check" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              You haven't set up two-factor authentication
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              Add a second step to keep your account safe even if your password is stolen.
            </p>
          </div>
        </div>
      )}

      {/* TOTP enrolment modal */}
      <TotpEnrolmentModal
        enrolment={add.stage === "totp-enrol" ? add.enrolment : null}
        onClose={() => setAdd({ stage: "idle" })}
        onVerified={async () => {
          setAdd({ stage: "idle" });
          toast.success("Authenticator added");
          await reload();
        }}
      />

      {/* SMS request modal */}
      <SmsRequestModal
        isOpen={add.stage === "sms-request"}
        onClose={() => setAdd({ stage: "idle" })}
        onEnrolled={(method) => setAdd({ stage: "sms-verify", method })}
      />

      {/* SMS verify modal */}
      <SmsVerifyModal
        method={add.stage === "sms-verify" ? add.method : null}
        onClose={() => setAdd({ stage: "idle" })}
        onVerified={async () => {
          setAdd({ stage: "idle" });
          toast.success("SMS code added");
          await reload();
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add method dropdown
// ---------------------------------------------------------------------------

function AddMethodMenu({
  supportsPasskey,
  isPasskeyRegistering,
  onAddPasskey,
  onAddTotp,
  onAddSms,
}: {
  supportsPasskey: boolean;
  isPasskeyRegistering: boolean;
  onAddPasskey: () => void;
  onAddTotp: () => void;
  onAddSms: () => void;
}): ReactNode {
  return (
    <Dropdown>
      <Button isPending={isPasskeyRegistering} size="sm" variant="primary">
        <Iconify className="size-4" icon="plus" />
        Add method
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "totp") onAddTotp();
            else if (key === "sms") onAddSms();
            else if (key === "passkey") onAddPasskey();
          }}
        >
          {supportsPasskey ? (
            <Dropdown.Item id="passkey" textValue="Passkey">
              <Iconify className="size-4 shrink-0 text-muted" icon="key" />
              <div className="flex flex-col">
                <Label>Passkey</Label>
                <Description>Biometrics or hardware key</Description>
              </div>
            </Dropdown.Item>
          ) : null}
          <Dropdown.Item id="totp" textValue="Authenticator">
            <Iconify className="size-4 shrink-0 text-muted" icon="mobile" />
            <div className="flex flex-col">
              <Label>Authenticator app</Label>
              <Description>Scan a QR code with your app</Description>
            </div>
          </Dropdown.Item>
          <Dropdown.Item id="sms" textValue="SMS">
            <Iconify className="size-4 shrink-0 text-muted" icon="message-square" />
            <div className="flex flex-col">
              <Label>SMS text message</Label>
              <Description>Code by text every sign-in</Description>
            </div>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// TOTP enrolment modal — QR + secret + verify
// ---------------------------------------------------------------------------

function TotpEnrolmentModal({
  enrolment,
  onClose,
  onVerified,
}: {
  enrolment: TotpEnrollmentResponse | null;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
}): ReactNode {
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const handleVerify = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!enrolment) return;

    setError(null);
    setSubmitting(true);

    try {
      await authApi.verifyMfaMethod(enrolment.method.id, { code });
      setCode("");
      await onVerified();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That code didn't match. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={enrolment !== null}
        onOpenChange={(open) => (!open ? onClose() : undefined)}
      >
        <Modal.Container size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add authenticator app</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Scan the code below with your authenticator app, then enter the 6-digit code.
              </p>
            </Modal.Header>
            <Modal.Body>
              {enrolment ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-border p-4">
                    <img
                      alt="TOTP QR code"
                      className="size-40 rounded-lg"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(enrolment.otpauth_url)}`}
                    />
                    <div className="text-center">
                      <p className="text-xs text-muted">Can't scan? Enter this secret manually</p>
                      <code className="mt-1 inline-block rounded-md bg-surface-secondary px-2 py-1 font-mono text-xs tracking-wider text-foreground">
                        {enrolment.secret}
                      </code>
                    </div>
                  </div>

                  <Form className="flex flex-col gap-3" onSubmit={handleVerify}>
                    <TextField isRequired maxLength={6} name="code" onChange={setCode} value={code}>
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
                        onPress={onClose}
                        type="button"
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                      <Button isPending={isSubmitting} type="submit" variant="primary">
                        Verify + add
                      </Button>
                    </div>
                  </Form>
                </div>
              ) : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SMS request modal — collect phone, server sends code
// ---------------------------------------------------------------------------

function SmsRequestModal({
  isOpen,
  onClose,
  onEnrolled,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEnrolled: (method: MfaMethodEntry) => void;
}): ReactNode {
  const [phone, setPhone] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await authApi.createMfaMethod({ method: "sms", phone });

      // `createMfaMethod` returns the enrolled method envelope; SMS
      // rows omit the `secret` / `otpauth_url` fields (they only
      // matter for TOTP). We reuse the same DTO shape.
      onEnrolled((response as { method: MfaMethodEntry }).method);
      setPhone("");
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

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Add SMS text message</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                We'll send a 6-digit code to this number every time you sign in.
              </p>
            </Modal.Header>
            <Modal.Body>
              <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <TextField isRequired name="phone" onChange={setPhone} type="tel" value={phone}>
                  <Label>Phone number</Label>
                  <Input autoComplete="tel" autoFocus placeholder="+1 (555) 123-4567" />
                  <Description>Use the international format, e.g. +1 555 555 5555.</Description>
                  {error ? <FieldError>{error}</FieldError> : null}
                </TextField>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    isDisabled={isSubmitting}
                    onPress={onClose}
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
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// SMS verify modal — enter the code
// ---------------------------------------------------------------------------

function SmsVerifyModal({
  method,
  onClose,
  onVerified,
}: {
  method: MfaMethodEntry | null;
  onClose: () => void;
  onVerified: () => Promise<void> | void;
}): ReactNode {
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!method) return;

    setError(null);
    setSubmitting(true);

    try {
      await authApi.verifyMfaMethod(method.id, { code });
      setCode("");
      await onVerified();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "That code didn't match. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={method !== null}
        onOpenChange={(open) => (!open ? onClose() : undefined)}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Verify the code we sent</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Enter the 6-digit code we sent to {method?.phone_masked ?? "your phone"}.
              </p>
            </Modal.Header>
            <Modal.Body>
              <Form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                <TextField isRequired maxLength={6} name="code" onChange={setCode} value={code}>
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
                    onPress={onClose}
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button isPending={isSubmitting} type="submit" variant="primary">
                    Verify + add
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
