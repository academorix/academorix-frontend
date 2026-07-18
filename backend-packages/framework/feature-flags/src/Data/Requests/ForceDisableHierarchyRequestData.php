<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for the platform-admin hierarchy force-disable path.
 *
 * `POST /api/v1/feature-flags/hierarchy/{flag}/force-disable`. `force = true`
 * is required — the action rejects otherwise with
 * `HierarchyDisableBlockedException` (Requirement 8.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ForceDisableHierarchyRequestData extends Data
{
    /**
     * @param  string  $flag   One of `hierarchy.regions` / `.organizations` / `.multi_branch`.
     * @param  bool    $force  Must be `true` — the guard flag that authorises the disable.
     */
    public function __construct(
        #[Required, StringType, In([
            'hierarchy.regions',
            'hierarchy.organizations',
            'hierarchy.multi_branch',
        ])]
        public string $flag,

        #[Required, BooleanType]
        public bool $force = false,
    ) {}
}
