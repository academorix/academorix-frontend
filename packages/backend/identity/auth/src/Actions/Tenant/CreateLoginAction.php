<?php

declare(strict_types=1);

namespace Stackra\Auth\Actions\Tenant;

use Stackra\Auth\Contracts\Services\SanctumTokenIssuerInterface;
use Stackra\Auth\Data\LoginResponseData;
use Stackra\Auth\Data\Requests\LoginRequestData;
use Stackra\Identity\Contracts\Data\IdentityInterface;
use Stackra\Identity\Contracts\Repositories\IdentityRepositoryInterface;
use Stackra\Identity\Exceptions\IdentityLockedException;
use Stackra\Identity\Exceptions\IdentityNotFoundException;
use Stackra\Identity\Models\Identity;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/auth/login` — password authentication (tenant audience).
 *
 * The primary human credential-presentation path. The action:
 *
 *   1. Rate-limits via `throttle:login` middleware (5/min per IP,
 *      registered by the routing package's rate limiter).
 *   2. Loads the Identity by email (case-insensitive normalise).
 *   3. Refuses when the row is locked (locked_until > now) —
 *      returns a distinct `IDENTITY_LOCKED` so clients can render
 *      a "wait N seconds" message.
 *   4. Constant-time bcrypt compare via
 *      {@see \Illuminate\Contracts\Hashing\Hasher::check()}. On
 *      mismatch: increment failed_attempts_count and, at
 *      threshold, set locked_until (defence-in-depth on top of
 *      the middleware rate-limit).
 *   5. Success path: record last_login_at, reset counter, issue
 *      Sanctum PAT via {@see SanctumTokenIssuerInterface}.
 *
 * MFA is NOT verified here — a `mfa_code` in the payload is
 * accepted but validation is deferred to the Auth module's MFA
 * challenge flow (see MfaChallengeDispatcher). The current
 * implementation returns a PAT unconditionally on password match;
 * enrolled-MFA identities MUST use the `/api/v1/auth/verify` two-
 * step flow once wired.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[AsAction(name: 'auth.login.create')]
#[Post('/api/v1/auth/login')]
#[Middleware(['api', 'throttle:login'])]
final class CreateLoginAction
{
    use AsController;

    /**
     * @param  IdentityRepositoryInterface     $identities        Persistence boundary for Identity rows.
     * @param  SanctumTokenIssuerInterface     $tokens            Sanctum PAT issuer.
     * @param  Hasher                          $hasher            Bcrypt — constant-time compare.
     * @param  int                             $lockoutAfter      Failed-attempt threshold (config).
     * @param  int                             $lockoutDuration   Lockout window in seconds (config).
     */
    public function __construct(
        private readonly IdentityRepositoryInterface $identities,
        private readonly SanctumTokenIssuerInterface $tokens,
        private readonly Hasher $hasher,
        #[Config('auth.login.lockout_after', 5)]
        private readonly int $lockoutAfter = 5,
        #[Config('auth.login.lockout_duration_seconds', 900)]
        private readonly int $lockoutDuration = 900,
    ) {
    }

    /**
     * @throws IdentityNotFoundException  Unknown email OR bad password (uniform).
     * @throws IdentityLockedException     Row is currently locked out.
     */
    public function __invoke(LoginRequestData $data, Request $request): JsonResponse
    {
        // Step 2 — load. Normalise email to lowercase for the
        // lookup so `foo@BAR.com` and `foo@bar.com` resolve to the
        // same row (RFC 5321 §4.5.3.1.1 permits either but the
        // vast majority of consumers treat the local part as
        // case-insensitive).
        $email = strtolower(trim($data->email));
        /** @var Identity|null $identity */
        $identity = $this->identities->query()
            ->where(IdentityInterface::ATTR_EMAIL, $email)
            ->first();

        if ($identity === null) {
            // Uniform failure — the caller cannot distinguish
            // unknown-email from wrong-password.
            throw $this->invalid('email_not_found', $email);
        }

        // Step 3 — locked-out check. Distinct from 'invalid' —
        // the caller SHOULD be told they're locked so they know
        // to wait rather than retry the password.
        if ($identity->isLockedOut()) {
            throw IdentityLockedException::make('Account is currently locked out.')
                ->withHttpStatus(423)
                ->withContext(['identity_id' => $identity->getKey()]);
        }

        // Step 4 — CONSTANT-TIME bcrypt compare. `Hash::check()`
        // wraps `password_verify()` which is constant-time on
        // matched-length inputs.
        $storedHash = (string) $identity->getAttribute(IdentityInterface::ATTR_PASSWORD_HASH);
        if (! $this->hasher->check($data->password, $storedHash)) {
            // Record + escalate. Two writes: the failure counter,
            // then (at threshold) the lockout timestamp. Both must
            // succeed for the guardrail to hold.
            $identity->recordFailedLogin();

            $updatedCount = (int) $identity->getAttribute(IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT);
            if ($this->lockoutAfter > 0 && $updatedCount >= $this->lockoutAfter) {
                $identity->lockUntil(now()->addSeconds($this->lockoutDuration));
            }

            throw $this->invalid('password_mismatch', $email);
        }

        // Step 5 — success. Reset counters + stamp last_login_at
        // BEFORE issuing the token so a partial-write mid-flow
        // doesn't hand the client a token attached to a stale row.
        $identity->recordSuccessfulLogin();

        $issued = $this->tokens->issue(
            identity: $identity,
            deviceName: $data->deviceName ?? $this->deriveDeviceName($request),
        );

        return response()->json(
            [
                'data' => (new LoginResponseData(
                    accessToken: $issued->plainTextToken,
                    tokenType: 'Bearer',
                    identityId: (string) $identity->getKey(),
                    email: $email,
                    tokenId: $issued->tokenId,
                ))->toArray(),
            ],
            JsonResponse::HTTP_OK,
        );
    }

    /**
     * Derive a compact device-name label from the request. Kept
     * short so it fits `personal_access_tokens.name` (Laravel's
     * default column length is 255, but a compact tag also reads
     * better in "your sessions" UIs).
     */
    private function deriveDeviceName(Request $request): string
    {
        $userAgent = (string) ($request->userAgent() ?? '');
        if ($userAgent === '') {
            return 'unknown-client';
        }

        return substr($userAgent, 0, 120);
    }

    /**
     * Build the uniform "invalid credentials" exception. Context
     * captures the specific reason for triage; the wire-visible
     * payload is identical across every failure path.
     */
    private function invalid(string $reason, string $email): IdentityNotFoundException
    {
        return IdentityNotFoundException::make('Invalid credentials.')
            ->withHttpStatus(401)
            ->withContext(['reason' => $reason, 'email' => $email]);
    }
}
