/**
 * @file email-verification-banner.tsx
 * @module components/email-verification-banner
 *
 * @description
 * Shell-level nag banner shown when the caller's email address is
 * unverified. Renders above the navbar so it's the first thing on
 * every page — but stays dismissible per-session so an operator
 * with a legit "I'll verify later" reason isn't hard-blocked.
 *
 * ## Data source
 *
 * The banner probes `GET /api/auth/email/verify` on mount (opaque
 * result — no PII beyond the verified boolean). Reasons for probing
 * rather than reading from cached identity:
 *
 *   - `authProvider.getIdentity()` doesn't currently carry a
 *     verification flag; adding it there would touch every consumer.
 *   - A verify-then-refresh round trip is cheap enough on a
 *     per-mount basis.
 *
 * ## Dismissal
 *
 * `sessionStorage` (not `localStorage`) so the banner reappears on
 * every fresh session — verified-later folks still see the reminder
 * on the next sign-in.
 *
 * ## Resend
 *
 * Fires `POST /api/auth/email/verification-notification`. Server
 * short-circuits with 202 when already verified so a rapid click
 * doesn't dispatch duplicate emails.
 */

import { Button, toast } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import { isAuthenticated } from "@/refine/identity-store";

const DISMISS_KEY = "academorix.email-verify.dismissed";

/**
 * Read the "banner dismissed" flag from sessionStorage. Guarded
 * against SSR + `SecurityError` cases (Safari private mode).
 */
function readDismissed(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // no-op — banner returns next mount when storage is unavailable.
  }
}

/**
 * Renders nothing when:
 *   - the caller isn't authenticated
 *   - the verification status hasn't resolved yet
 *   - the caller is already verified
 *   - the caller dismissed the banner this session
 *
 * Rendered near the top of `AppShell`.
 */
export function EmailVerificationBanner(): ReactNode {
  const [state, setState] = useState<"loading" | "verified" | "unverified" | "hidden">(() =>
    readDismissed() ? "hidden" : "loading",
  );
  const [email, setEmail] = useState<string>("");
  const [isResending, setResending] = useState<boolean>(false);

  useEffect(() => {
    if (state === "hidden") return;

    // Only probe when we know we're authenticated — the request
    // requires a Bearer token and would otherwise 401.
    if (!isAuthenticated()) {
      setState("hidden");

      return;
    }

    let cancelled = false;

    authApi
      .emailVerificationStatus()
      .then((response) => {
        if (cancelled) return;

        setEmail(response.email);
        setState(response.verified ? "verified" : "unverified");
      })
      .catch(() => {
        if (cancelled) return;

        // Silent failure — a 401 or transient network error should
        // never make the banner block the shell. It'll retry on the
        // next mount / page reload.
        setState("hidden");
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const handleResend = useCallback(async (): Promise<void> => {
    setResending(true);
    try {
      await authApi.emailVerificationResend();
      toast.success("Verification email sent", {
        description: email ? `Check ${email} for the link.` : "Check your inbox in a minute.",
      });
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't send the verification email. Please try again.";

      toast.danger(message);
    } finally {
      setResending(false);
    }
  }, [email]);

  const handleDismiss = useCallback((): void => {
    writeDismissed();
    setState("hidden");
  }, []);

  if (state !== "unverified") return null;

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-foreground sm:px-6"
      role="status"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
        <Iconify className="size-4" icon="envelope" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">Verify your email address</span>
        <span className="text-xs text-muted">
          {email
            ? `We sent a link to ${email}. Verify to unlock payouts, exports, and safeguarding-safe messaging.`
            : "Verify your email to unlock payouts, exports, and safeguarding-safe messaging."}
        </span>
      </div>
      <div className="ms-auto flex items-center gap-2">
        <Button isPending={isResending} onPress={handleResend} size="sm" variant="primary">
          <Iconify className="size-4" icon="paper-plane" />
          Resend email
        </Button>
        <Button
          aria-label="Dismiss for this session"
          isIconOnly
          onPress={handleDismiss}
          size="sm"
          variant="ghost"
        >
          <Iconify className="size-4" icon="xmark" />
        </Button>
      </div>
    </div>
  );
}
