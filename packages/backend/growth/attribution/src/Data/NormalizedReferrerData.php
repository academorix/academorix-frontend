<?php

declare(strict_types=1);

namespace Academorix\Attribution\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Result of a referrer normalization.
 *
 * @category Attribution
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NormalizedReferrerData extends Data
{
    /**
     * @param  string|null  $raw     Original Referer header value.
     * @param  string|null  $host    Normalised host (lower-case, `www.` stripped).
     * @param  string|null  $path    Path portion of the URL.
     * @param  string       $type    `direct` / `search` / `social` / `referral`.
     * @param  string|null  $engine  Canonical name — `google`, `facebook`, `linkedin` — when `type` is `search` or `social`.
     */
    public function __construct(
        public ?string $raw,
        public ?string $host,
        public ?string $path,
        public string $type,
        public ?string $engine,
    ) {
    }
}
