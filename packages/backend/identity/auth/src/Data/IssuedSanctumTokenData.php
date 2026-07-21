<?php

declare(strict_types=1);

namespace Stackra\Auth\Data;

use DateTimeImmutable;
use Laravel\Sanctum\NewAccessToken;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire response for a freshly-issued Sanctum PAT.
 *
 * The `plainTextToken` value is the ONLY time the plaintext PAT is
 * available — Sanctum stores only a hash on the row. Callers must
 * hand it to the client immediately and never persist it.
 *
 * The `tokenId` echoes the `personal_access_tokens.id` column so a
 * subsequent DELETE / logout can target this specific token
 * without decoding the plaintext.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class IssuedSanctumTokenData extends Data
{
    /**
     * @param  string             $plainTextToken  The plaintext PAT. Ephemeral — hand to client, forget.
     * @param  int|string         $tokenId         `personal_access_tokens.id` for the row.
     * @param  string             $tokenName       Device name recorded on the row.
     * @param  DateTimeImmutable  $issuedAt        When the token was issued.
     * @param  list<string>       $abilities       Sanctum abilities attached to the token.
     */
    public function __construct(
        public readonly string $plainTextToken,
        public readonly int|string $tokenId,
        public readonly string $tokenName,
        public readonly DateTimeImmutable $issuedAt,
        public readonly array $abilities = ['*'],
    ) {
    }

    /**
     * Factory from Sanctum's `NewAccessToken` — the shape
     * `HasApiTokens::createToken()` returns.
     */
    public static function fromNewAccessToken(NewAccessToken $sanctum, string $tokenName): self
    {
        // The `accessToken` field is Sanctum's `PersonalAccessToken`
        // model row — its primary key is what we need for later
        // revocation.
        return new self(
            plainTextToken: $sanctum->plainTextToken,
            tokenId: $sanctum->accessToken->getKey(),
            tokenName: $tokenName,
            issuedAt: new DateTimeImmutable(),
            abilities: $sanctum->accessToken->abilities ?? ['*'],
        );
    }
}
