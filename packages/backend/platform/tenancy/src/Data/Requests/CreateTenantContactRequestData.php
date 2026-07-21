<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data\Requests;

use Stackra\Tenancy\Enums\TenantContactKind;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/current-tenant/contacts` (self-service)
 * and `POST /api/v1/platform/tenants/{tenant}/contacts` (platform admin).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTenantContactRequestData extends Data
{
    /**
     * @param  TenantContactKind         $kind        Contact role.
     * @param  string                    $name        Person or team name.
     * @param  string                    $email       Primary email.
     * @param  string|null               $phone       Optional phone (E.164 preferred).
     * @param  string|null               $jobTitle    Optional job title.
     * @param  array<string, mixed>|null $address     Optional structured address.
     * @param  string|null               $notes       Optional free-form notes.
     * @param  bool                      $isPrimary   Whether to mark as primary of its kind.
     */
    public function __construct(
        #[Required, Enum(TenantContactKind::class)]
        public TenantContactKind $kind,

        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, Email, Max(320)]
        public string $email,

        #[StringType, Max(32)]
        public ?string $phone = null,

        #[StringType, Max(200)]
        public ?string $jobTitle = null,

        public ?array $address = null,

        #[StringType]
        public ?string $notes = null,

        public bool $isPrimary = false,
    ) {
    }
}
