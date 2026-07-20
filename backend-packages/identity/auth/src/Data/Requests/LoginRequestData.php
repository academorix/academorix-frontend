<?php

declare(strict_types=1);

namespace Academorix\Auth\Data\Requests;

use SensitiveParameter;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated credentials for `POST /api/v1/auth/login`.
 *
 * The `password` parameter carries `#[SensitiveParameter]` so
 * stack traces, `var_dump`, Sentry envelopes, and structured log
 * lines all redact it. The DTO holds the plaintext only for the
 * duration of the constant-time bcrypt check inside the login
 * action.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class LoginRequestData extends Data
{
    /**
     * @param  string       $email       Account email address (verified via Email rule).
     * @param  string       $password    Plaintext password. Verified via `password_verify`.
     * @param  string|null  $mfaCode     Optional TOTP / recovery code when MFA is enrolled.
     * @param  string|null  $deviceName  Optional label persisted on the issued PAT.
     */
    public function __construct(
        #[Required, StringType, Email, Max(255)]
        public string $email,

        #[Required, StringType, Min(1), Max(255)]
        #[SensitiveParameter]
        public string $password,

        #[StringType, Max(16)]
        public ?string $mfaCode = null,

        #[StringType, Max(255)]
        public ?string $deviceName = null,
    ) {
    }
}
