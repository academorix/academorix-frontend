<?php

declare(strict_types=1);

namespace Stackra\Auth\Data;

use Stackra\Auth\Enums\JwtPayloadPurpose;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;

/**
 * Structured JWT payload for inter-service HS256 tokens.
 *
 * Every field maps 1:1 to `modules/identity/blueprints/auth/schemas/jwt-payload.schema.json`.
 * The `iss` / `aud` / `sub` / `app` / `iat` / `exp` / `kid` / `jti`
 * / `purpose` claims are REQUIRED for every token in every purpose
 * class; `tid` / `sco` / `roles` / `permissions` are optional and
 * only populated for the token classes that need them.
 *
 * ## Wire shape
 *
 * The signer serialises this DTO into a JSON object with EXACTLY
 * the claim names above — no camelCase renaming. Consumers on the
 * verifier side hydrate `JwtPayloadData` back from the JSON.
 *
 * ## Immutability
 *
 * Every property is `readonly` — a signed JWT's payload is the
 * signed byte string, so mutating it after issuance would break
 * the signature. Downstream code MAY construct a new DTO to
 * describe a new token, but never mutate an existing one.
 *
 * @category Auth
 *
 * @since    0.1.0
 */
final class JwtPayloadData extends Data
{
    /**
     * @param  string             $iss          Issuer URL (e.g. `https://identity.stackra.com`).
     * @param  list<string>       $aud          Intended recipient hostnames. At least one entry.
     * @param  string             $sub          Subject id (ULID `usr_...` / `plu_...` / `svc_...`).
     * @param  string             $app          Application slug ULID (`app_...`) or a slug ("app_sports").
     * @param  int                $iat          Issued-at unix timestamp (seconds).
     * @param  int                $exp          Expiry unix timestamp (seconds).
     * @param  string             $kid          Signing-key id matching an `auth_jwt_signing_keys.kid` row.
     * @param  string             $jti          Fresh UUID per issuance. Deny-list key.
     * @param  JwtPayloadPurpose  $purpose      Distinguishes user_session / service_account / impersonation.
     * @param  string|null        $tid          Tenant ULID (`tnt_...`). Absent for platform / cross-tenant subjects.
     * @param  array<string,mixed>|null $sco    Scope claims (org_id / region_id / branch_id / team_ids...).
     * @param  list<string>|null  $roles        Compact role names at issue-time.
     * @param  list<string>|null  $permissions  Compact permission names at issue-time.
     * @param  array<string,mixed>|null $impersonator  Impersonation payload — platform_user_id + reason.
     */
    public function __construct(
        #[Required, StringType]
        public readonly string $iss,

        #[Required, ArrayType]
        public readonly array $aud,

        #[Required, StringType]
        public readonly string $sub,

        #[Required, StringType]
        public readonly string $app,

        #[Required, IntegerType, Min(0)]
        public readonly int $iat,

        #[Required, IntegerType, Min(0)]
        public readonly int $exp,

        #[Required, StringType]
        public readonly string $kid,

        #[Required, StringType]
        public readonly string $jti,

        #[Required, Enum(JwtPayloadPurpose::class)]
        public readonly JwtPayloadPurpose $purpose,

        public readonly ?string $tid = null,

        public readonly ?array $sco = null,

        public readonly ?array $roles = null,

        public readonly ?array $permissions = null,

        public readonly ?array $impersonator = null,
    ) {
    }

    /**
     * Materialise the payload into the exact JSON shape the signer
     * base64url-encodes. Absent optional claims are OMITTED (not
     * emitted as `null`) so downstream services can distinguish
     * "no tid" from "explicit null tid" per the schema's `type:
     * ["string","null"]` optional semantics.
     *
     * @return array<string, mixed>
     */
    public function toClaims(): array
    {
        // Required claims — every JWT ships them.
        $claims = [
            'iss' => $this->iss,
            'aud' => $this->aud,
            'sub' => $this->sub,
            'app' => $this->app,
            'iat' => $this->iat,
            'exp' => $this->exp,
            'kid' => $this->kid,
            'jti' => $this->jti,
            'purpose' => $this->purpose->value,
        ];

        // Optional claims — only emit when populated. Distinguishes
        // "field absent" from "field present with a null value"
        // per the JWT-payload schema's mixed nullable/optional
        // semantics.
        if ($this->tid !== null) {
            $claims['tid'] = $this->tid;
        }

        if ($this->sco !== null) {
            $claims['sco'] = $this->sco;
        }

        if ($this->roles !== null) {
            $claims['roles'] = $this->roles;
        }

        if ($this->permissions !== null) {
            $claims['permissions'] = $this->permissions;
        }

        if ($this->impersonator !== null) {
            $claims['impersonator'] = $this->impersonator;
        }

        return $claims;
    }
}
