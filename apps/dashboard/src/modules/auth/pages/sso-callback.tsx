/**
 * @file sso-callback.tsx
 * @module modules/auth/pages/sso-callback
 *
 * @description
 * SSO handoff exchange page — `/sso/callback?token=…&expires_at=…`.
 *
 * The SAML ACS controller (`SamlAcsController`) and the OIDC
 * callback controller (`OidcCallbackController`) both redirect the
 * user's browser here after minting a **one-time-use handoff PAT**.
 * The page runs the exchange machine synchronously on mount:
 *
 *   1. Read the token from the URL — query string first, fragment
 *      (`#token=…`) as a fallback. Some enterprise IdPs prefer the
 *      fragment form because it doesn't hit the server access log.
 *   2. POST to `/api/auth/sso/exchange` — the backend validates the
 *      handoff's `sso.exchange` ability, marks the handoff row
 *      `consumed_at = now()` inside a `SELECT FOR UPDATE`
 *      transaction, and returns a long-lived Sanctum PAT envelope.
 *   3. Persist the returned PAT via {@link writeAuthToken} +
 *      {@link writeCachedUser}.
 *   4. Call {@link refreshIdentity} to fetch the full `/me` manifest.
 *   5. Navigate to `/dashboard`.
 *
 * ## Bearer trickery
 *
 * The exchange endpoint expects the **handoff token** as the
 * `Authorization: Bearer` header — not a session token the caller
 * doesn't have yet. Rather than teaching the HTTP wrapper about
 * custom bearers, we {@link writeAuthToken} the handoff first so
 * the wrapper picks it up on the exchange call, then overwrite
 * with the real token from the response. On any failure the
 * catch-block calls {@link clearAuthToken} so a leaked handoff
 * can't linger in `localStorage`.
 *
 * ## Failure path
 *
 * A 401 from the exchange endpoint (expired handoff, already-
 * consumed token, tampered signature) surfaces as a full error
 * card with a "Return to sign-in" link back to `/sign-in`. The
 * page **never** silently retries — a leaked handoff token could
 * otherwise be replayed by an attacker watching the tab. Fail
 * closed is the security-first default here.
 */

import { Button, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { ApiError } from "@/lib/api/http-client";
import { AuthShell } from "@/modules/auth/components/auth-shell";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import { clearAuthToken, writeAuthToken, writeCachedUser } from "@/lib/auth/token-store";
import { refreshIdentity } from "@/refine/identity-store";

/** State machine for the callback page. */
type CallbackState = "exchanging" | "error";

/** Parsed handoff params. */
interface HandoffTokenParams {
  token: string | null;
  expiresAt: string | null;
}

/**
 * Read the handoff `token` + `expires_at` from either the URL query
 * string (the common case — SAML ACS + OIDC callback both use a
 * standard 302 with query params) or the URL fragment (a fallback
 * some IdPs prefer for SPAs so the token never reaches the server
 * access log via the `Referer` header).
 *
 * Returns `{token: null, expiresAt: null}` when neither surface
 * carries a token — the caller renders the error card.
 */
function useSsoCallbackToken(): HandoffTokenParams {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  return useMemo<HandoffTokenParams>(() => {
    const queryToken = searchParams.get("token");
    const queryExpires = searchParams.get("expires_at");

    if (queryToken) {
      return { token: queryToken, expiresAt: queryExpires };
    }

    // Fragment fallback — `location.hash` is `"#token=…&expires_at=…"`
    // when present. Strip the leading `#` and parse as a search
    // string so `URLSearchParams` does the decoding for us.
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;

    if (!hash) return { token: null, expiresAt: null };

    const fragmentParams = new URLSearchParams(hash);

    return {
      token: fragmentParams.get("token"),
      expiresAt: fragmentParams.get("expires_at"),
    };
  }, [searchParams, location.hash]);
}

/**
 * Top-level page. Owns the exchange state machine + renders one of
 * two states — an accessible spinner while the exchange is in
 * flight, or an error card if any step failed.
 */
export default function SsoCallbackPage(): ReactNode {
  const [state, setState] = useState<CallbackState>("exchanging");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const { token, expiresAt } = useSsoCallbackToken();

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("Missing SSO token. Please try signing in again.");

      return;
    }

    let cancelled = false;

    // ---------------------------------------------------------------
    // Bearer bootstrap — write the handoff first so the HTTP wrapper
    // attaches it as `Authorization: Bearer …` on the exchange call.
    // The response's PAT overwrites it moments later. If the exchange
    // fails, the catch-block clears the store so the handoff doesn't
    // linger in localStorage.
    // ---------------------------------------------------------------
    writeAuthToken({ accessToken: token, expiresAt: expiresAt ?? null });

    (async () => {
      try {
        const result = await authApi.ssoExchange();

        if (cancelled) return;

        writeAuthToken({
          accessToken: result.access_token,
          expiresAt: result.expires_at,
        });
        writeCachedUser(result.user);

        try {
          await refreshIdentity();
        } catch {
          // A failed `/me` shouldn't block the redirect — the shell
          // retries on next mount. Cached user + PAT are already
          // persisted, so the dashboard renders cleanly.
        }

        if (!cancelled) {
          navigate("/dashboard", { replace: true });
        }
      } catch (caught) {
        if (cancelled) return;

        // Fail-closed: wipe the handoff we just wrote so nothing
        // usable is left in the store for a subsequent tab / retry.
        clearAuthToken();

        setState("error");
        setErrorMessage(
          caught instanceof ApiError
            ? caught.message
            : "We couldn't complete your SSO sign-in. Please try again.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // We deliberately want this effect to run once per mount — the
    // handoff is single-use, so re-running on prop change is a foot
    // gun. `token` + `expiresAt` come from the URL, which doesn't
    // change while the page is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "exchanging") {
    return (
      <AuthShell
        description="Hang tight — we're finishing your single sign-on."
        title="Signing you in"
      >
        <SsoExchangingState />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="We couldn't complete your single sign-on. The handoff link may have expired or already been used."
      title="Sign-in failed"
    >
      <SsoErrorState message={errorMessage} />
    </AuthShell>
  );
}

/**
 * Centred spinner + supporting copy for the in-flight state.
 *
 * The wrapping element carries `role="status"` and an `aria-label`
 * so a screen reader announces "Signing you in" without needing the
 * heading in `AuthShell` to be in the same live region.
 */
function SsoExchangingState(): ReactNode {
  return (
    <div
      aria-label="Signing you in with single sign-on"
      className="flex flex-col items-center gap-4 py-6"
      role="status"
    >
      <Spinner color="accent" size="lg" />
      <p className="text-sm text-muted">
        Exchanging your sign-on handoff for a session. This only takes a moment.
      </p>
    </div>
  );
}

/**
 * Error card + return-to-sign-in link.
 *
 * `role="alert"` + `aria-live="assertive"` announces the failure
 * without the caller needing to focus-trap the shell. The link back
 * to `/sign-in` is the only recovery affordance — there is no
 * "retry" affordance by design (fail-closed, see the file header).
 */
function SsoErrorState({ message }: { message: string }): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      <div
        aria-live="assertive"
        className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm"
        role="alert"
      >
        <Iconify className="mt-0.5 size-5 shrink-0 text-danger" icon="triangle-exclamation" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">SSO sign-in failed</p>
          <p className="text-xs leading-relaxed text-muted">
            {message || "The handoff link is no longer valid. Try signing in again."}
          </p>
        </div>
      </div>

      <Link to="/sign-in">
        <Button fullWidth variant="primary">
          Return to sign-in
          <Iconify className="size-4" icon="arrow-right" />
        </Button>
      </Link>
    </div>
  );
}
