/**
 * @file verify-email.tsx
 * @module modules/auth/pages/verify-email
 *
 * @description
 * Consumes the signed verification URL emailed to a caller after
 * signup / email-change. Runs the verification synchronously on
 * mount, then presents one of three states:
 *
 *   - **verifying** — spinner + "just a moment" copy.
 *   - **verified** — success card, CTA back to sign-in / dashboard.
 *   - **failed** — error card with copy pointing at the resend
 *     mechanism from Settings.
 *
 * The URL shape is
 * `/verify-email?id={id}&hash={hash}&signature={sig}&expires={ts}`.
 * Missing / malformed params short-circuit to the `failed` state.
 */

import { Button, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import { isAuthenticated } from "@/refine/identity-store";

type ViewState = "verifying" | "verified" | "failed";

export default function VerifyEmailPage(): ReactNode {
  const [searchParams] = useSearchParams();
  const isSignedIn = useMemo(isAuthenticated, []);

  const id = searchParams.get("id");
  const hash = searchParams.get("hash");
  const signature = searchParams.get("signature");
  const expires = searchParams.get("expires");

  const [state, setState] = useState<ViewState>(
    id && hash && signature && expires ? "verifying" : "failed",
  );
  const [errorMessage, setErrorMessage] = useState<string>(
    "The verification link is missing required information. Please open the link from your inbox again.",
  );

  useEffect(() => {
    if (!id || !hash || !signature || !expires) return;

    let cancelled = false;

    authApi
      .emailVerify({ id, hash, signature, expires })
      .then(() => {
        if (!cancelled) setState("verified");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        setErrorMessage(
          caught instanceof ApiError
            ? caught.message
            : "We couldn't verify your email. The link may have expired.",
        );
        setState("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [id, hash, signature, expires]);

  if (state === "verifying") {
    return (
      <AuthShell
        description="Hang tight — we're verifying your email address."
        title="Verifying your email"
      >
        <div className="flex items-center justify-center py-6">
          <Spinner color="accent" size="lg" />
        </div>
      </AuthShell>
    );
  }

  if (state === "verified") {
    return (
      <AuthShell
        description="Your email address is now verified. You're all set."
        title="Email verified"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm">
            <Iconify className="mt-0.5 size-5 shrink-0 text-success" icon="circle-check" />
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">You're verified</p>
              <p className="text-xs leading-relaxed text-muted">
                Verification unlocks payment history, exports, and safeguarding-safe messaging.
              </p>
            </div>
          </div>

          {isSignedIn ? (
            <Link to="/dashboard">
              <Button fullWidth variant="primary">
                Continue to your dashboard
                <Iconify className="size-4" icon="arrow-right" />
              </Button>
            </Link>
          ) : (
            <Link to="/sign-in">
              <Button fullWidth variant="primary">
                Sign in to your workspace
                <Iconify className="size-4" icon="arrow-right" />
              </Button>
            </Link>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="We couldn't verify your email address. The link may have expired or already been used."
      title="Verification failed"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
          <Iconify className="mt-0.5 size-5 shrink-0 text-danger" icon="triangle-exclamation" />
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground">Link no longer usable</p>
            <p className="text-xs leading-relaxed text-muted">{errorMessage}</p>
          </div>
        </div>

        {isSignedIn ? (
          <Link to="/settings/security">
            <Button fullWidth variant="primary">
              Request a new verification email
              <Iconify className="size-4" icon="arrow-right" />
            </Button>
          </Link>
        ) : (
          <Link to="/sign-in">
            <Button fullWidth variant="primary">
              Back to sign in
            </Button>
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
