<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire DTO for a feature kill-switch row.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureKillSwitchData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $flag         Stable flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug`.
     * @param  string|null  $scopeValue   Entity id at `scopeLevel`; null = every value at that level.
     * @param  string|null  $reason       Operator-supplied reason.
     * @param  string       $enabledAt    ISO-8601 activation timestamp.
     * @param  string|null  $disabledAt   ISO-8601 timestamp; null = no upper bound.
     */
    public function __construct(
        public string $id,
        public string $flag,
        public string $scopeLevel,
        public ?string $scopeValue,
        public ?string $reason,
        public string $enabledAt,
        public ?string $disabledAt,
    ) {}
}
