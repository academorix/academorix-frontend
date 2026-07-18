/**
 * @file sign-in.tsx
 * @module modules/auth/pages/sign-in
 *
 * @description
 * The primary unauthenticated entrypoint. Runs a small Slack-style
 * state machine on top of a single route:
 *
 *   1. **workspace** (central host only)
 *      Prompt for the workspace slug, fetch the branding preview,
 *      surface the tenant name + logo + colours before continuing.
 *
 *   2. **email**
 *      Prompt for the caller's email. Skipped when we've been
 *      handed an email through the URL (e.g. `?email=`).
 *
 *   3. **password**
 *      Prompt for the password + submit `POST /api/auth/login`.
 *
 *   4. **two-factor** (conditional)
 *      When the login response carries `two_factor_required: true`,
 *      swap to the 6-digit code form inline — no route change so
 *      the sessionStorage handoff we used previously is unnecessary.
 *
 * ## Direct URL landing
 *
 * A visitor who types `acme.academorix.com/sign-in` skips step 1
 * automatically — the workspace is resolved from the hostname and
 * the preview fetch runs on mount to paint the tenant chrome.
 * Central-host visitors always start at step 1.
 */

import { Button, Description, Form, Input, InputGroup, Label, TextField } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "@stackra/routing/react";

import type { FormEvent, ReactNode } from "react";
import type { LoginResult, SsoLookupResult, WorkspacePreview } from "@/lib/api/auth-api";

import { AuthShell } from "@/modules/auth/components/auth-shell";
import { ApiError } from "@/lib/api/http-client";
import { PasswordField } from "@/modules/auth/components/password-field";
import { SignInAlternatives } from "@/modules/auth/components/sign-in-alternatives";
import { authApi } from "@/lib/api/auth-api";
import { buildCentralUrl, resolveWorkspace } from "@/lib/auth/workspace-resolver";
import { readCachedPreview, useWorkspaceBranding } from "@/lib/auth/workspace-branding";
import { writeAuthToken, writeCachedUser } from "@/lib/auth/token-store";
import { refreshIdentity } from "@/refine/identity-store";

import { Iconify } from "@/icons/iconify";
import { BrandIsotipo } from "@/brand";

/** Slug pattern — DNS-safe, mirrors the backend rule. */
const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * How long the email-step SSO lookup is allowed to run before we
 * give up and fall through to the password step.
 *
 * Three seconds is a deliberate trade-off:
 *
 *   - Long enough for a warm backend (< 250ms P50) to comfortably
 *     answer + for the browser to redirect on a match.
 *   - Short enough that a cold DNS / slow tenant-resolution round
 *     trip doesn't strand the user on a spinner. If the lookup
 *     stalls, users on federated domains still land on the password
 *     step and can either retry (getting the cache-warm answer) or
 *     use the explicit "Continue with SSO" button below the form.
 *
 * ## Why not longer
 *
 * A 10s+ wait would trap non-federated users behind a network stall
 * they don't need to care about. SSO is a minority of sign-ins;
 * this wall keeps the majority path snappy.
 */
const SSO_LOOKUP_TIMEOUT_MS = 3000;

/** State-machine step for the sign-in flow. */
type SignInStep = "workspace" | "email" | "password" | "two-factor";

/**
 * Guard a `?next=…` value so a phishing link can't send the user to
 * a foreign origin. Rejects protocol-relative / absolute URLs and
 * falls back to `/dashboard` on anything suspicious.
 */
function safeNextPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";

  return raw;
}

/**
 * Top-level page. Owns the flow state + branches to the workspace
 * picker when we haven't resolved a tenant yet, or the tenant flow
 * when we have.
 */
export default function SignInPage(): ReactNode {
  const [searchParams] = useSearchParams();
  const hostWorkspace = useMemo(() => resolveWorkspace(), []);
  const nextPath = safeNextPath(searchParams.get("next"));

  // Central-host path — workspace picker. Handled by its own
  // component so the two flows stay independent + testable.
  if (hostWorkspace.mode !== "tenant") {
    return <CentralHostFlow nextPath={nextPath} />;
  }

  // Tenant subdomain — go straight to the tenant flow.
  return (
    <TenantFlow
      initialEmail={searchParams.get("email") ?? ""}
      nextPath={nextPath}
      slug={hostWorkspace.slug}
    />
  );
}

// ---------------------------------------------------------------------------
// Central-host flow
// ---------------------------------------------------------------------------

/**
 * Central-host workspace picker + preview. Once the user submits a
 * slug, we fetch the branding preview and — if valid — redirect to
 * the tenant subdomain's `/sign-in` with the branding pre-cached.
 */
function CentralHostFlow({ nextPath }: { nextPath: string }): ReactNode {
  const [slug, setSlug] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [preview, setPreview] = useState<WorkspacePreview | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const trimmed = slug.trim().toLowerCase();

    if (!WORKSPACE_SLUG_PATTERN.test(trimmed)) {
      setError("Workspace URL can only include lowercase letters, numbers, and hyphens.");

      return;
    }

    setSubmitting(true);

    try {
      const next = await authApi.previewWorkspace(trimmed);

      setPreview(next);

      // Cache the preview in the sessionStorage layer used by the
      // tenant-side hook so the redirected page can paint branded
      // chrome without a second fetch. The hook re-fetches on
      // mount anyway for freshness.
      try {
        const existing = window.sessionStorage.getItem("academorix.auth.workspace-preview");
        const map = existing ? (JSON.parse(existing) as Record<string, WorkspacePreview>) : {};

        map[trimmed] = next;
        window.sessionStorage.setItem("academorix.auth.workspace-preview", JSON.stringify(map));
      } catch {
        // Storage unavailable — the tenant page refetches on
        // mount, so we still work.
      }

      // Kick a short delay so the preview card is visible for a
      // beat before the browser navigation kicks in — the user
      // sees "yes, this is Acme Athletics" before landing on the
      // sign-in page.
      window.setTimeout(() => {
        const url = `${next.workspace_url}/sign-in${
          nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""
        }`;

        window.location.assign(url);
      }, 400);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setError("We couldn't find that workspace. Check the URL and try again.");
      } else if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError("We couldn't reach the workspace directory. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      description="Enter your workspace's URL to continue. We'll take you to your team's sign-in page."
      footer={
        <span>
          New to Academorix?{" "}
          <Link className="font-medium text-foreground hover:underline" to="/sign-up">
            Create a workspace
          </Link>
        </span>
      }
      title="Sign in to Academorix"
      workspace={preview}
    >
      <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          isDisabled={isSubmitting}
          isInvalid={Boolean(error)}
          isRequired
          name="workspace"
          onChange={(value) => {
            setSlug(value);
            if (error) setError(null);
          }}
          value={slug}
        >
          <Label>Your workspace URL</Label>
          <InputGroup fullWidth>
            <InputGroup.Input
              autoComplete="off"
              autoFocus
              placeholder="acme-athletics"
              spellCheck={false}
            />
            <InputGroup.Suffix>.academorix.com</InputGroup.Suffix>
          </InputGroup>
          {error ? (
            <Description className="text-danger">{error}</Description>
          ) : (
            <Description>The URL your team signs in to.</Description>
          )}
        </TextField>

        {preview ? <WorkspacePreviewCard preview={preview} /> : null}

        <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
          Continue
        </Button>

        <div className="flex flex-col items-center gap-1 text-sm text-muted">
          <Link className="hover:text-foreground" to="/find-workspaces">
            Don't remember your workspace URL?
          </Link>
        </div>
      </Form>
    </AuthShell>
  );
}

/** Small confirmation card — shown after a successful workspace lookup. */
function WorkspacePreviewCard({ preview }: { preview: WorkspacePreview }): ReactNode {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3">
      {preview.logo_url ? (
        <img
          alt={`${preview.name} logo`}
          className="size-10 shrink-0 rounded-lg bg-white object-contain p-1 ring-1 ring-black/5"
          src={preview.logo_url}
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface p-1.5 ring-1 ring-border">
          <BrandIsotipo aria-hidden="true" className="size-full object-contain" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{preview.name}</span>
        <span className="truncate text-xs text-muted">{preview.workspace_url}</span>
      </div>
      <Iconify className="size-5 shrink-0 text-accent" icon="circle-check" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tenant flow
// ---------------------------------------------------------------------------

/**
 * Two-step form on the tenant subdomain: email → password. Adds a
 * conditional 2FA step when the login response asks for it.
 */
function TenantFlow({
  slug,
  initialEmail,
  nextPath,
}: {
  slug: string;
  initialEmail: string;
  nextPath: string;
}): ReactNode {
  const { preview, isLoading: isBrandingLoading } = useWorkspaceBranding(slug);
  const fallbackPreview = useMemo(() => readCachedPreview(slug) ?? null, [slug]);
  const workspace = preview ?? fallbackPreview;

  const [step, setStep] = useState<SignInStep>(initialEmail ? "password" : "email");
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>("");
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeExpiresIn, setChallengeExpiresIn] = useState<number>(0);
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [isRecoveryCodeMode, setRecoveryCodeMode] = useState<boolean>(false);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  useEffect(() => {
    setFormError(null);
    setFieldErrors({});
  }, [step]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const trimmed = email.trim();

    if (!trimmed) {
      setFieldErrors({ email: "Enter your email to continue." });

      return;
    }

    setEmail(trimmed);
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      // ---------------------------------------------------------------
      // SSO domain sniff — hits `/api/sso/lookup` with a 3-second wall.
      //
      // A hit (envelope carries `sso_url`) redirects the whole page to
      // the IdP. The SPA flow ends here — the browser follows the
      // redirect out of the SPA; the `/sso/callback` page picks up the
      // return leg and re-hydrates the session.
      //
      // A miss returns `{}` (never a 404 — see `SsoLookupController`
      // — to avoid leaking enrolment). Any error path (network hiccup,
      // 3s abort, malformed body) falls through silently to the
      // password step: SSO is a helper, not a gate; a stuck lookup
      // must never block a user with a valid password.
      // ---------------------------------------------------------------
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), SSO_LOOKUP_TIMEOUT_MS);

      let result: SsoLookupResult | null = null;

      try {
        result = await authApi.ssoLookup(trimmed, { signal: controller.signal });
      } finally {
        window.clearTimeout(timer);
      }

      if (result?.sso_url) {
        // Full-page redirect — the IdP flow leaves the SPA. SPA state
        // is safe to lose because `/sso/callback` re-hydrates on the
        // return leg. Return early so the finally-block resets
        // `isSubmitting` before the navigation actually kicks in
        // (React won't render again either way).
        window.location.assign(result.sso_url);

        return;
      }
    } catch {
      // Network hiccup or the 3-second abort — silently fall through
      // to the password step. Never block the primary path.
    } finally {
      setSubmitting(false);
    }

    setStep("password");
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const result = await authApi.login({
        email,
        password,
        device_name: "Web session",
      });

      // 2FA-required branch — pivot to the challenge step without a
      // route change so the challenge token stays in memory only.
      if ("two_factor_required" in result && result.two_factor_required) {
        setChallengeToken(result.challenge_token);
        setChallengeExpiresIn(result.challenge_expires_in);
        setStep("two-factor");

        return;
      }

      writeAuthToken({
        accessToken: result.access_token,
        expiresAt: result.expires_at,
      });
      writeCachedUser(result.user);

      try {
        await refreshIdentity();
      } catch {
        // A failed `/me` shouldn't block a fresh sign-in — the
        // shell refetches on mount.
      }

      navigate(nextPath, { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors(caught.fieldErrors());
        setFormError(caught.message);

        return;
      }

      const message =
        (caught as { message?: string } | null)?.message ??
        "We couldn't sign you in. Please try again.";

      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!challengeToken) return;

    const trimmed = twoFactorCode.trim();

    if (!trimmed) return;

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await authApi.twoFactorChallenge({
        challenge_token: challengeToken,
        code: trimmed,
        is_recovery_code: isRecoveryCodeMode || undefined,
      });

      writeAuthToken({
        accessToken: result.access_token,
        expiresAt: result.expires_at,
      });
      writeCachedUser(result.user);

      try {
        await refreshIdentity();
      } catch {
        // shell handles the refetch on mount.
      }

      navigate(nextPath, { replace: true });
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "That code didn't match. Try again or use a recovery code.";

      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Shared handler for alternative-method sign-ins (passkey, SMS OTP).
   * Persists the token, refreshes identity, and either navigates or
   * flips to the 2FA challenge step depending on the response branch.
   * Kept as a single helper so passkey + SMS OTP + password all end
   * up in the same post-login state.
   */
  const handleAltSignIn = async (result: LoginResult): Promise<void> => {
    if ("two_factor_required" in result && result.two_factor_required) {
      setChallengeToken(result.challenge_token);
      setChallengeExpiresIn(result.challenge_expires_in);
      setStep("two-factor");

      return;
    }

    writeAuthToken({
      accessToken: result.access_token,
      expiresAt: result.expires_at,
    });
    writeCachedUser(result.user);

    try {
      await refreshIdentity();
    } catch {
      // shell refetches on mount.
    }

    navigate(nextPath, { replace: true });
  };

  const changeWorkspace = (): void => {
    window.location.assign(`${buildCentralUrl()}/sign-in`);
  };

  const badge = workspace ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-muted">
      {workspace.name}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-muted">
      {slug}
    </span>
  );

  const heading = (() => {
    switch (step) {
      case "email":
        return workspace ? `Sign in to ${workspace.name}` : "Sign in";
      case "password":
        return "Enter your password";
      case "two-factor":
        return "Two-factor authentication";
      default:
        return "Sign in";
    }
  })();

  const subheading = (() => {
    switch (step) {
      case "email":
        return "Enter the email you use to sign in to this workspace.";
      case "password":
        return `Signing in as ${email}.`;
      case "two-factor":
        return isRecoveryCodeMode
          ? "Enter one of the recovery codes you saved when you enabled 2FA."
          : `Enter the 6-digit code from your authenticator app. Challenge expires in ${Math.floor(challengeExpiresIn / 60)}m.`;
      default:
        return undefined;
    }
  })();

  return (
    <AuthShell
      badge={badge}
      description={subheading}
      footer={
        step === "email" ? (
          <span>
            Don't have an account?{" "}
            <Link className="font-medium text-foreground hover:underline" to="/sign-up">
              Sign up
            </Link>
          </span>
        ) : null
      }
      title={heading}
      workspace={workspace}
    >
      {step === "email" ? (
        <Form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
          <TextField
            isDisabled={isSubmitting}
            isInvalid={Boolean(fieldErrors.email)}
            isRequired
            name="email"
            onChange={setEmail}
            type="email"
            value={email}
          >
            <Label>Email</Label>
            <Input
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              spellCheck={false}
            />
            {fieldErrors.email ? (
              <Description className="text-danger">{fieldErrors.email}</Description>
            ) : null}
          </TextField>

          <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
            Continue
          </Button>

          <SignInAlternatives
            emailHint={email || undefined}
            onSignedIn={handleAltSignIn}
            tenantSlug={slug}
          />

          <button
            className="self-center text-sm text-muted hover:text-foreground"
            onClick={changeWorkspace}
            type="button"
          >
            Not the right workspace? Choose another
          </button>

          {isBrandingLoading ? (
            <div className="flex items-center justify-center gap-1 text-xs text-muted">
              <Iconify className="size-3.5 animate-spin" icon="arrows-rotate-left" />
              Loading workspace details…
            </div>
          ) : null}
        </Form>
      ) : null}

      {step === "password" ? (
        <Form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary/40 p-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Iconify className="size-4 shrink-0 text-muted" icon="person" />
              <span className="truncate text-sm text-foreground">{email}</span>
            </div>
            <button
              className="text-xs text-muted hover:text-foreground"
              onClick={() => setStep("email")}
              type="button"
            >
              Change
            </button>
          </div>

          <PasswordField
            autoComplete="current-password"
            autoFocus
            errorMessage={fieldErrors.password}
            isRequired
            label="Password"
            name="password"
            onChange={setPassword}
            placeholder="Enter your password"
            value={password}
          />

          <div className="flex items-center justify-end text-sm text-muted">
            <Link className="hover:text-foreground" to="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          {formError ? <FormError message={formError} /> : null}

          <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
            Sign in{workspace ? ` to ${workspace.name}` : ""}
          </Button>

          <button
            className="self-center text-sm text-muted hover:text-foreground"
            onClick={changeWorkspace}
            type="button"
          >
            Not the right workspace? Choose another
          </button>
        </Form>
      ) : null}

      {step === "two-factor" ? (
        <Form className="flex flex-col gap-4" onSubmit={handleTwoFactorSubmit}>
          <TextField
            isRequired
            maxLength={isRecoveryCodeMode ? 20 : 6}
            name="code"
            onChange={setTwoFactorCode}
            value={twoFactorCode}
          >
            <Label>{isRecoveryCodeMode ? "Recovery code" : "Verification code"}</Label>
            <Input
              autoComplete="one-time-code"
              autoFocus
              inputMode={isRecoveryCodeMode ? "text" : "numeric"}
              placeholder={isRecoveryCodeMode ? "aaaa-bbbb-cccc" : "123456"}
              spellCheck={false}
            />
            <Description>
              {isRecoveryCodeMode
                ? "Recovery codes are one-time. This one will be marked as used."
                : "Open your authenticator app and enter the current code."}
            </Description>
          </TextField>

          {formError ? <FormError message={formError} /> : null}

          <Button fullWidth isPending={isSubmitting} type="submit" variant="primary">
            Verify and continue
          </Button>

          <button
            className="self-center text-sm text-muted hover:text-foreground"
            onClick={() => {
              setRecoveryCodeMode((prev) => !prev);
              setTwoFactorCode("");
              setFormError(null);
            }}
            type="button"
          >
            {isRecoveryCodeMode ? "Use authenticator code instead" : "Use a recovery code"}
          </button>

          <button
            className="self-center text-sm text-muted hover:text-foreground"
            onClick={() => {
              setChallengeToken(null);
              setTwoFactorCode("");
              setStep("password");
            }}
            type="button"
          >
            Back to password
          </button>
        </Form>
      ) : null}
    </AuthShell>
  );
}

/** Shared error banner — kept as a tiny helper for consistency across steps. */
function FormError({ message }: { message: string }): ReactNode {
  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {message}
    </div>
  );
}
