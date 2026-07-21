<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use SensitiveParameter;

/**
 * Validated payload for `POST /api/v1/service-accounts/token`.
 *
 * The `secret` field is `#[SensitiveParameter]` at every hop past
 * this DTO — logs, stack traces, and Sentry events all mask it.
 * The DTO itself carries it as a plain string only for the
 * duration of the constant-time bcrypt comparison inside the
 * exchange action.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TokenExchangeRequestData extends Data
{
    /**
     * @param  string        $serviceAccountId  ULID (`svc_...`) of the SA presenting credentials.
     * @param  string        $secret            Plain rotation secret. Constant-time compared against `secret_hash`.
     * @param  list<string>  $aud               Intended downstream services (aud claim).
     * @param  int|null      $ttlSeconds        Optional TTL override in seconds. Clamped by `service-accounts.jwt.max_ttl_seconds`.
     */
    public function __construct(
        #[Required, StringType, Regex('/^svc_[0-9A-HJKMNP-TV-Za-z]{20,30}$/')]
        public string $serviceAccountId,

        // NB: `SensitiveParameter` on the parameter suppresses the
        // value from stack traces + var_dump. The property itself
        // is plain — the DTO only holds it for the length of the
        // exchange action's Hash::check call.
        #[Required, StringType, Min(20), Max(255)]
        #[SensitiveParameter]
        public string $secret,

        #[Required, ArrayType, Min(1)]
        public array $aud,

        #[Between(30, 3600)]
        public ?int $ttlSeconds = null,
    ) {
    }
}
