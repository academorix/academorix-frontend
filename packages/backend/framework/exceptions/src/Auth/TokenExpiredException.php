<?php

/**
 * @file packages/exceptions/src/Auth/TokenExpiredException.php
 *
 * @description
 * HTTP 401 — the presented token was valid at some point but its TTL
 * has elapsed. Subclass of {@see AuthenticationException} so callers
 * that only need "any 401" still catch it, but with a distinct
 * `errorCode` so clients can branch:
 *
 *   - `auth.unauthenticated` → prompt user to log in.
 *   - `auth.token.expired`   → run the refresh flow silently.
 *
 * ## Named factory
 *
 * Use {@see forTokenId()} to attach the (opaque) token identifier
 * to the context. The identifier is safe to log — it's the row PK,
 * not the plaintext token — and helps audit dashboards trace
 * suspicious expiry patterns.
 *
 * ## Translation key
 *
 *   exceptions::auth.token_expired
 *
 * @see AuthenticationException  Parent class carrying the 401
 *                               severity / category defaults.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Auth;

class TokenExpiredException extends AuthenticationException
{
    /**
     * Distinct machine-readable code so clients can branch between
     * "expired" (run refresh flow) and "unauthenticated" (kick to
     * login). Renaming would break every mobile client — treat as
     * public API.
     */
    public const CODE = 'auth.token.expired';

    /**
     * Class-level translation key pointing at
     * `lang/en/auth.php → token_expired`. Overridable per-instance
     * via {@see \Academorix\Exceptions\Concerns\TranslatesMessages::withTranslationKey()}.
     */
    public const TRANSLATION_KEY = 'exceptions::auth.token_expired';

    /**
     * Named factory: "the token identified by this row-pk has TTL'd out."
     *
     * The token ID goes into context, never into the user-facing
     * message — logs with a leaked plaintext token are a security
     * incident. The developer-facing `Throwable::getMessage()` DOES
     * carry the id but is masked in production by the JSON
     * formatter for exceptions at `Error` severity or above.
     *
     * @param  string  $tokenId  Opaque token identifier — typically
     *                           the `personal_access_tokens.id` row
     *                           primary key or a Sanctum ULID.
     *                           MUST NOT be the plaintext token
     *                           itself.
     * @return static The fluent instance with `context.token_id`
     *                populated.
     */
    public static function forTokenId(string $tokenId): static
    {
        return static::make("Token \"{$tokenId}\" is expired.")
            ->withContext(['token_id' => $tokenId]);
    }
}
