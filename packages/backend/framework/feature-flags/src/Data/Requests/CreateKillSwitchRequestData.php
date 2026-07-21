<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Nullable;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/feature-flags/kill-switches`.
 *
 * Platform-scoped — every request runs under the `platform_admin`
 * role via `#[RequireRole('platform_admin')]` on the action.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateKillSwitchRequestData extends Data
{
    /**
     * @param  string       $flag        Stable dot-separated flag identifier.
     * @param  string       $scopeLevel  `scope_definitions.slug`.
     * @param  string|null  $scopeValue  Entity id at `scopeLevel`; null = every value at that level.
     * @param  string       $enabledAt   ISO-8601 activation timestamp.
     * @param  string|null  $disabledAt  Optional ISO-8601 deactivation timestamp.
     * @param  string|null  $reason      Optional operator-supplied reason.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $flag,

        #[Required, StringType, Max(64)]
        public string $scopeLevel,

        #[Nullable, StringType, Max(191)]
        public ?string $scopeValue = null,

        #[Required, StringType]
        public string $enabledAt = 'now',

        #[Nullable, StringType]
        public ?string $disabledAt = null,

        #[Nullable, StringType, Max(500)]
        public ?string $reason = null,
    ) {}
}
