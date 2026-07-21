<?php

declare(strict_types=1);

namespace Academorix\Leads\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/leads/{lead}/assign`.
 *
 * `ownerId` must be a `usr_` ULID pointing at an active tenant User
 * with the `leads.assign` capability — the policy check happens on
 * the Action side.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AssignLeadRequestData extends Data
{
    /**
     * @param  string       $ownerId  ULID of the User to assign as owner.
     * @param  string|null  $note     Optional operator note recorded on the LeadActivity timeline.
     */
    public function __construct(
        #[Required, StringType, Regex('/^usr_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $ownerId,

        #[StringType, Max(2000)]
        public ?string $note = null,
    ) {
    }
}
