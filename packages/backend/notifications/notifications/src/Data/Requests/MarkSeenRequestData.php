<?php

declare(strict_types=1);

namespace Stackra\Notifications\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/notifications/{id}/seen`.
 *
 * The body is intentionally minimal — the notification id comes from
 * the route parameter; this DTO carries only the optional `seenVia`
 * discriminator so consumers can distinguish explicit-tap from
 * auto-on-view.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class MarkSeenRequestData extends Data
{
    /**
     * @param  string|null  $seenVia  `explicit` / `auto_on_view` / `mark_all`.
     */
    public function __construct(
        #[StringType, Max(32)]
        public ?string $seenVia = 'explicit',
    ) {
    }
}
