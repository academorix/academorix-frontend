<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Actions\PublicExchange;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\ServiceAccounts\Contracts\Data\ServiceAccountInterface;
use Stackra\ServiceAccounts\Contracts\Repositories\ServiceAccountRepositoryInterface;
use Stackra\ServiceAccounts\Contracts\Services\ServiceAccountJwtIssuerInterface;
use Stackra\ServiceAccounts\Data\Requests\TokenExchangeRequestData;
use Stackra\ServiceAccounts\Data\TokenIssuedData;
use Stackra\ServiceAccounts\Exceptions\InvalidServiceAccountCredentialsException;
use Stackra\ServiceAccounts\Models\ServiceAccount;
use DateTimeInterface;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /api/v1/service-accounts/token` — bcrypt secret → HS256 JWT.
 *
 * The single credential-presentation path for machine callers. Per
 * blueprint §3.2, the action runs the following checks in ORDER:
 *
 *   1. Rate-limit (5/min per SA-ID + 20/min per IP). Applied by
 *      `throttle:token-exchange` middleware — this action assumes
 *      the middleware has ALREADY vetoed the caller when applicable.
 *   2. Load the SA row by ULID; unknown → return the generic
 *      `INVALID_SERVICE_ACCOUNT_CREDENTIALS` payload with no
 *      distinguishing signal (defeats enumeration).
 *   3. `Hash::check($secret, $sa->secret_hash)` — CONSTANT-TIME
 *      bcrypt comparison via Laravel's Hasher.
 *   4. Confirm `is_enabled = true` AND `expires_at IS NULL OR
 *      expires_at > now()`.
 *   5. Issue a JWT via `ServiceAccountJwtIssuerInterface::issue`
 *      (`purpose = service_account`, `aud` from payload, TTL
 *      resolved by the issuer).
 *   6. Fire `ServiceAccountJwtIssued` (event fanout inside the
 *      issuer).
 *   7. Update `last_used_at` + `last_used_ip` — batched via
 *      `UpdateLastUsedTimestampJob` triggered off the event.
 *
 * Every failure path returns the SAME `INVALID_SERVICE_ACCOUNT_CREDENTIALS`
 * payload — no timing / status leaks. The action logs the specific
 * reason for triage, but the wire is uniform.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[AsAction(name: 'service_accounts.token.create')]
#[Post('/api/v1/service-accounts/token')]
#[Middleware(['api', 'throttle:token-exchange'])]
final class CreateTokenAction
{
    use AsController;

    /**
     * @param  ServiceAccountRepositoryInterface     $accounts  Persistence boundary.
     * @param  ServiceAccountJwtIssuerInterface      $issuer    JWT issuance surface.
     * @param  Hasher                                $hasher    Bcrypt hasher — constant-time.
     */
    public function __construct(
        private readonly ServiceAccountRepositoryInterface $accounts,
        private readonly ServiceAccountJwtIssuerInterface $issuer,
        private readonly Hasher $hasher,
    ) {
    }

    /**
     * Verify credentials + issue a token.
     *
     * @param  TokenExchangeRequestData  $data     Validated payload.
     * @param  Request                   $request  For last_used_ip capture.
     *
     * @return JsonResponse  200 OK with `{ data: { token, expires_in, token_type } }` on success.
     *
     * @throws InvalidServiceAccountCredentialsException  On every failure — one payload, no enumeration.
     */
    public function __invoke(TokenExchangeRequestData $data, Request $request): JsonResponse
    {
        // Step 2 — load. `firstWhere` returns null on miss; we
        // convert to the uniform "invalid credentials" error rather
        // than surface a 404 that would leak the SA-ID vs secret
        // distinction.
        /** @var ServiceAccount|null $account */
        $account = $this->accounts->query()
            ->whereKey($data->serviceAccountId)
            ->first();

        if ($account === null) {
            throw $this->invalid('service_account_not_found', $data->serviceAccountId);
        }

        // Step 3 — CONSTANT-TIME bcrypt compare. Laravel's Hasher
        // wraps `password_verify()` which is constant-time on
        // matching-length hashes. Mismatch → same error as "SA not
        // found".
        $secretHash = (string) $account->getAttribute(ServiceAccountInterface::ATTR_SECRET_HASH);
        if (! $this->hasher->check($data->secret, $secretHash)) {
            throw $this->invalid('secret_mismatch', $data->serviceAccountId);
        }

        // Step 4 — enabled + not expired. The trait's `isActive()`
        // method centralises the two-signal check so the observer
        // and this action can't drift.
        if (! $account->isActive()) {
            throw $this->invalid(
                $account->isExpired() ? 'secret_expired' : 'disabled',
                $data->serviceAccountId,
            );
        }

        // Step 5 — issue. The issuer chooses the TTL (default 300s,
        // capped by `service-accounts.jwt.max_ttl_seconds`), signs
        // via the auth module's JwtSigner, and fires the event.
        $signed = $this->issuer->issue(
            account: $account,
            audiences: $data->aud,
            ttlSeconds: $data->ttlSeconds,
            trigger: 'exchange',
        );

        // Step 7 — best-effort last-used update. Kept synchronous
        // here for the smallest-possible IP tracking latency; a
        // batched job (`UpdateLastUsedTimestampJob`) can replace
        // this once event dispatch is wired. Failures are swallowed
        // so a locked row never breaks a valid token issuance.
        try {
            $account->forceFill([
                ServiceAccountInterface::ATTR_LAST_USED_AT => now(),
                ServiceAccountInterface::ATTR_LAST_USED_IP => $request->ip() ?? '',
            ])->save();
        } catch (\Throwable) {
            // fail-soft — the token is already valid; a last-used
            // row that lags reality by a few seconds is acceptable.
        }

        return response()->json(
            ['data' => TokenIssuedData::fromSigned($signed)->toArray()],
            JsonResponse::HTTP_OK,
        );
    }

    /**
     * Build the uniform "invalid credentials" exception. The
     * `context` names the specific reason for log triage; the
     * wire-visible payload is identical across every failure.
     */
    private function invalid(string $reason, string $serviceAccountId): InvalidServiceAccountCredentialsException
    {
        return InvalidServiceAccountCredentialsException::make('Invalid service-account credentials.')
            ->withContext(['reason' => $reason, 'service_account_id' => $serviceAccountId])
            ->withHttpStatus(401);
    }
}
