/**
 * @file verify-email-page.tsx
 * @module modules/auth/pages/verify-email-page
 *
 * @description
 * Landing page for the emailed verify-email signed link. The backend serves
 * {@code GET /api/auth/email/verify/{id}/{hash}?signature=…} directly
 * (Laravel's {@code signed} middleware validates the HMAC), but visitors may
 * hit the link on a device that is not signed in, so the SPA renders a
 * friendly redirector page that reads the params + shows the result.
 *
 * If the params are present, the page redirects to the backend URL after a
 * short delay (giving the user a chance to read the message). Otherwise we
 * ask them to check their email again.
 */

import { CheckCircleIcon, EnvelopeIcon } from "@academorix/ui/icons/outline";
import { Button } from "@academorix/ui/react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

import type { ReactNode } from "react";

import { env } from "@/config/env";
import { appRoutes } from "@/lib/module";
import { AuthCard } from "@/modules/auth/components/auth-card";

/** The verify-email landing page. */
export default function VerifyEmailPage(): ReactNode {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("id");
  const hash = params.get("hash");
  const signature = params.get("signature");
  const expires = params.get("expires");

  const hasParams = Boolean(id && hash && signature);

  /**
   * Builds the backend URL that Laravel's signed middleware validates.
   * Undefined when any required param is missing so the effect below can
   * short-circuit without touching {@code window.location}.
   */
  const verifyUrl = hasParams
    ? `${env.VITE_API_URL}${env.VITE_API_PATH}/auth/email/verify/${id}/${hash}?signature=${signature}&expires=${expires ?? ""}`
    : undefined;

  useEffect(() => {
    if (!verifyUrl) {
      return;
    }

    // The verification endpoint is on the backend; navigate the browser
    // directly so the signed URL retains its query string intact.
    window.location.replace(verifyUrl);
  }, [verifyUrl]);

  if (!hasParams) {
    return (
      <AuthCard
        description="This verification link is missing required information."
        title="Invalid verification link"
      >
        <div className="flex flex-col gap-4 px-6 pb-6">
          <EnvelopeIcon aria-hidden="true" className="mx-auto size-10 text-muted" />
          <p className="text-sm text-muted">
            Please open the link from your latest verification email, or resend a fresh one from the
            verification-notice page.
          </p>
          <Button className="w-full" variant="secondary" onPress={() => navigate(appRoutes.login)}>
            Back to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard description="Confirming your address with the server." title="Verifying your email">
      <div className="flex flex-col items-center gap-4 px-6 pb-6 text-center">
        <CheckCircleIcon aria-hidden="true" className="size-10 text-accent" />
        <p className="text-sm text-muted">
          You will be redirected in a moment. If nothing happens, click the button below.
        </p>
        <Button
          className="w-full"
          variant="secondary"
          onPress={() => {
            if (verifyUrl) {
              window.location.href = verifyUrl;
            }
          }}
        >
          Verify now
        </Button>
      </div>
    </AuthCard>
  );
}
