/**
 * @file webauthn.ts
 * @module lib/auth/webauthn
 *
 * @description
 * Thin wrapper around `@simplewebauthn/browser` that turns a
 * two-step server round-trip (fetch options → run browser
 * authenticator → verify) into a single async call. Two entry
 * points:
 *
 *   - {@link signInWithPasskey} — anonymous sign-in via passkey.
 *   - {@link registerPasskey} — enrol a new passkey for the current caller.
 *
 * ## Why wrap the browser lib
 *
 * The raw `startAuthentication` / `startRegistration` calls need
 * the JSON envelope from the server as their input. Callers
 * always want the same shape: pass a hint (email / label) →
 * receive a `LoginResult` / `MfaMethodEntry`. Encapsulating that
 * plumbing here keeps every UI call site trivially small.
 *
 * ## Browser support
 *
 * `startAuthentication` / `startRegistration` throw when the
 * browser doesn't support WebAuthn. The UI should already have
 * hidden the "Sign in with a passkey" affordance in that case
 * (see {@link isWebAuthnSupported}), so any throw here indicates
 * a real problem worth surfacing.
 */

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

import type { LoginResult, MfaMethodEntry, WebauthnOptionsResponse } from "@/lib/api/auth-api";

import { authApi } from "@/lib/api/auth-api";

/**
 * Feature-detect WebAuthn on the current browser. False for
 * anything without `PublicKeyCredential` (older Safari, most
 * embedded webviews). Used to hide the passkey affordance.
 */
export function isWebAuthnSupported(): boolean {
  if (typeof window === "undefined") return false;

  return (
    typeof window.PublicKeyCredential === "function" &&
    typeof navigator.credentials?.get === "function"
  );
}

/**
 * Feature-detect platform authenticator (Touch ID, Windows Hello,
 * Android biometric). Falls back to `false` on any browser that
 * doesn't expose the async `isUserVerifyingPlatformAuthenticatorAvailable`
 * static.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Complete anonymous passkey sign-in. The `email` hint is optional
 * — passing it lets the server scope the allow-credentials list
 * to that user, which trims a "which passkey?" browser prompt on
 * caller-multi-passkey devices.
 */
export async function signInWithPasskey(email?: string): Promise<LoginResult> {
  const { options, challenge_id: challengeId } = (await authApi.webauthnLoginOptions({
    email,
  })) as WebauthnOptionsResponse;

  const assertion = await startAuthentication(
    // @simplewebauthn's types are strict about the JSON shape — the
    // wire payload matches `PublicKeyCredentialRequestOptionsJSON`
    // exactly, so a cast is safe.
    options as Parameters<typeof startAuthentication>[0],
  );

  return authApi.webauthnLoginVerify({
    credential: assertion,
    challenge_id: challengeId,
  });
}

/**
 * Register a new passkey against the current authenticated user.
 * Requires a valid Sanctum token in the token store. Optional
 * `label` is persisted on the credential row so the caller can
 * distinguish "Alex's iPhone" from "Company laptop" later.
 */
export async function registerPasskey(label?: string): Promise<MfaMethodEntry> {
  const { options, challenge_id: challengeId } = (await authApi.webauthnRegisterOptions({
    label,
  })) as WebauthnOptionsResponse;

  const attestation = await startRegistration(options as Parameters<typeof startRegistration>[0]);

  const { method } = await authApi.webauthnRegisterVerify({
    credential: attestation,
    challenge_id: challengeId,
  });

  return method;
}
