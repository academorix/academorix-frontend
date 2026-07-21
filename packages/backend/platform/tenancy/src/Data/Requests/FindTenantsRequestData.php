<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Email;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/auth/find-tenants`.
 *
 * Central-host self-service: user forgets which tenant they belong
 * to. The action returns the tenants their email is a member of; a
 * follow-up email is dispatched with clickable magic links.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class FindTenantsRequestData extends Data
{
    /**
     * @param  string  $email  Identity email to search by (case-insensitive).
     */
    public function __construct(
        #[Required, Email, Max(320)]
        public string $email,
    ) {
    }
}
