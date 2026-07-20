<?php

declare(strict_types=1);

namespace Academorix\Identity\Models;

use Academorix\Foundation\Concerns\Filterable;
use Academorix\Foundation\Concerns\HasMetadata;
use Academorix\Identity\Concerns\CanResetPassword;
use Academorix\Identity\Concerns\HasCredentialLifecycle;
use Academorix\Identity\Concerns\IsIdentity;
use Academorix\Identity\Contracts\Data\IdentityInterface;
use Academorix\Identity\Database\Factories\IdentityFactory;
use Academorix\Identity\Policies\IdentityPolicy;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Scout\Searchable;
use Mattiverse\Userstamps\Traits\Userstamps;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Eloquent model for a Identity.
 *
 * Global credential record — one row per real human, shared across
 * every Application they can authenticate to. Composes:
 *
 *   - Laravel's `Authenticatable` trait — provides `getAuthIdentifier`,
 *     `getAuthPassword` (via `password_hash` column, remapped in
 *     `authPasswordName()`), and remember-token accessors.
 *   - `CanResetPassword` — bridges Laravel's password broker to
 *     the Academorix column contract.
 *   - `HasApiTokens` — Sanctum PAT surface. The token-issuance
 *     path lives in {@see \Academorix\Auth\Services\SanctumTokenIssuer};
 *     the model just carries the relation.
 *   - `IsIdentity` — lockout / verified checks.
 *   - `HasCredentialLifecycle` — failed-attempt counter management.
 *
 * `#[Hidden]` covers every secret column — `password_hash`,
 * `mfa_secret_encrypted`, recovery-code hashes, password history,
 * and the email-verification token hash. A stray `toArray()` on
 * this model must NEVER emit any of them to the wire.
 *
 * @category Identity
 *
 * @since    0.1.0
 */
#[Table(
    name: IdentityInterface::TABLE,
    key: IdentityInterface::PRIMARY_KEY,
    keyType: IdentityInterface::KEY_TYPE,
)]
#[Fillable([
    IdentityInterface::ATTR_EMAIL,
    IdentityInterface::ATTR_PASSWORD_HASH,
    IdentityInterface::ATTR_MFA_SECRET_ENCRYPTED,
    IdentityInterface::ATTR_MFA_RECOVERY_CODES_HASHED,
    IdentityInterface::ATTR_EMAIL_VERIFIED_AT,
    IdentityInterface::ATTR_EMAIL_VERIFICATION_TOKEN_HASH,
    IdentityInterface::ATTR_EMAIL_VERIFICATION_EXPIRES_AT,
    IdentityInterface::ATTR_PASSWORD_HISTORY_HASHED,
    IdentityInterface::ATTR_PASSWORD_CHANGED_AT,
    IdentityInterface::ATTR_LAST_LOGIN_AT,
    IdentityInterface::ATTR_LAST_FAILED_AT,
    IdentityInterface::ATTR_LOCKED_UNTIL,
    IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT,
    IdentityInterface::ATTR_DOB,
    IdentityInterface::ATTR_METADATA,
])]
#[Hidden([
    IdentityInterface::ATTR_PASSWORD_HASH,
    IdentityInterface::ATTR_MFA_SECRET_ENCRYPTED,
    IdentityInterface::ATTR_MFA_RECOVERY_CODES_HASHED,
    IdentityInterface::ATTR_EMAIL_VERIFICATION_TOKEN_HASH,
    IdentityInterface::ATTR_PASSWORD_HISTORY_HASHED,
])]
#[UseFactory(IdentityFactory::class)]
#[UsePolicy(IdentityPolicy::class)]
#[WithoutIncrementing]
final class Identity extends Model implements AuthenticatableContract, CanResetPasswordContract, IdentityInterface
{
    use Authenticatable;
    use CanResetPassword;
    use Filterable;
    use HasApiTokens;
    use HasCredentialLifecycle;
    use HasFactory;
    use HasMetadata;
    use HasUlids;
    use IsIdentity;
    use LogsActivity;
    use Notifiable;
    use Searchable;
    use SoftDeletes;
    use Userstamps;

    /**
     * Column holding the hashed password. Overrides Laravel's
     * default `password` name so the Authenticatable trait reads
     * the correct column via `getAuthPassword()`.
     */
    protected function authPasswordName(): string
    {
        return IdentityInterface::ATTR_PASSWORD_HASH;
    }

    /**
     * Cast map — datetime / integer / array coercion on hydrate.
     * MFA + recovery-code casts intentionally use Laravel's built-in
     * `encrypted:array` + `array` casts rather than the bespoke
     * `EncryptedMfaSecret` / `HashedRecoveryCodes` classes referenced
     * in the blueprint but not yet emitted — swap over when those
     * cast classes land under Casts/.
     *
     * @var array<string, string>
     */
    protected $casts = [
        IdentityInterface::ATTR_EMAIL_VERIFIED_AT => 'datetime',
        IdentityInterface::ATTR_EMAIL_VERIFICATION_EXPIRES_AT => 'datetime',
        IdentityInterface::ATTR_PASSWORD_CHANGED_AT => 'datetime',
        IdentityInterface::ATTR_LAST_LOGIN_AT => 'datetime',
        IdentityInterface::ATTR_LAST_FAILED_AT => 'datetime',
        IdentityInterface::ATTR_LOCKED_UNTIL => 'datetime',
        IdentityInterface::ATTR_FAILED_ATTEMPTS_COUNT => 'integer',
        IdentityInterface::ATTR_DOB => 'date',
        // Encrypted-at-rest — Laravel's Crypt facade round-trip.
        IdentityInterface::ATTR_MFA_SECRET_ENCRYPTED => 'encrypted',
        IdentityInterface::ATTR_MFA_RECOVERY_CODES_HASHED => 'array',
        IdentityInterface::ATTR_PASSWORD_HISTORY_HASHED => 'array',
    ];
}
