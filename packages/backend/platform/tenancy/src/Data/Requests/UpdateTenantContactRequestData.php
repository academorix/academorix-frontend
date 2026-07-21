<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/current-tenant/contacts/{contact}`.
 *
 * Every field is optional — Spatie preserves the untouched fields.
 * `kind` is deliberately NOT editable: change the row's kind by
 * deleting + recreating.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTenantContactRequestData extends Data
{
    /**
     * @param  string|null               $name       Person or team name.
     * @param  string|null               $email      Primary email.
     * @param  string|null               $phone      Contact phone.
     * @param  string|null               $jobTitle   Job title.
     * @param  array<string, mixed>|null $address    Structured address.
     * @param  string|null               $notes      Free-form notes.
     * @param  bool|null                 $isPrimary  Promote to primary of kind.
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[Email, Max(320)]
        public ?string $email = null,

        #[StringType, Max(32)]
        public ?string $phone = null,

        #[StringType, Max(200)]
        public ?string $jobTitle = null,

        public ?array $address = null,

        #[StringType]
        public ?string $notes = null,

        public ?bool $isPrimary = null,
    ) {
    }
}
