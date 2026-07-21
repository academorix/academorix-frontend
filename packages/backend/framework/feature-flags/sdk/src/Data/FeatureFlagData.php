<?php

declare(strict_types=1);

namespace Stackra\FeatureFlagsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire DTO for a feature-flag catalog entry.
 *
 * Bi-directional — used both on request payloads and response
 * envelopes. Wire format is snake_case; PHP field names are
 * camelCase.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
#[MapOutputName(SnakeCaseMapper::class)]
final class FeatureFlagData extends Data
{
    /**
     * @param  string       $id           Prefixed ULID.
     * @param  string       $name         Stable dot-separated flag identifier.
     * @param  string|null  $description  Free-form description.
     * @param  string       $kind         Backing value of `FlagKind`.
     * @param  bool         $defaultOff   Whether the class-default returns false.
     * @param  int|null     $cacheTtl     Per-flag cache TTL in seconds; null inherits config.
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $description,
        public string $kind,
        public bool $defaultOff,
        public ?int $cacheTtl,
    ) {}
}
