<?php

declare(strict_types=1);

namespace Academorix\Auth\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire response for a successful `POST /api/v1/auth/login`.
 *
 * The plaintext PAT is returned exactly once — the client MUST
 * store it before dropping the response body. The `identity_id`
 * echoes back the Identity ULID so a client that lost track of
 * its own account (e.g. via SSO handoff) can still key off it.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class LoginResponseData extends Data
{
    /**
     * @param  string       $accessToken  Plaintext Sanctum PAT.
     * @param  string       $tokenType    Always `"Bearer"` today.
     * @param  string       $identityId   The subject Identity's ULID.
     * @param  string       $email        Echo of the caller's email.
     * @param  int|string   $tokenId      `personal_access_tokens.id` — for later revocation.
     */
    public function __construct(
        public readonly string $accessToken,
        public readonly string $tokenType,
        public readonly string $identityId,
        public readonly string $email,
        public readonly int|string $tokenId,
    ) {
    }
}
