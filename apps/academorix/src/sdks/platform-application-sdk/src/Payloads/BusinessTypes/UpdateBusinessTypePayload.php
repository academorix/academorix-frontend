<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Payloads\BusinessTypes;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for
 * `PATCH /api/v1/business-types/{key}` (platform-admin audience).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with `Optional` defaults. `key` is immutable
 * once created; the server refuses any request that includes it and
 * responds with `422 business_type_key_immutable`. It is NOT part of
 * this payload for that reason — the route parameter identifies the
 * row instead.
 *
 * ## Example
 *
 * ```php
 * // Rename the label without touching anything else — the wire has
 * // exactly one key.
 * $patch = new UpdateBusinessTypePayload(label: 'Sports Academy');
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateBusinessTypePayload extends Data
{
    /**
     * @param  Optional|string                     $label          Active-locale label. 1..255 chars.
     * @param  Optional|string                     $description    Active-locale description. 1..2000 chars.
     * @param  Optional|array<string, mixed>       $defaultConfig  Provisioning defaults bag. Sent as-is; the server validates shape.
     * @param  Optional|string|null                $icon           Iconify token; pass `null` to clear.
     * @param  Optional|string|null                $heroImageUrl   Hero image URL; pass `null` to clear.
     * @param  Optional|int                        $priority       Sort priority (ascending on the picker).
     * @param  Optional|bool                       $isVisible      When `false`, hide from the self-serve picker (platform-admin-only assignment).
     */
    public function __construct(
        #[StringType, Min(1), Max(255)]
        public Optional|string $label = new Optional(),

        #[StringType, Min(1), Max(2000)]
        public Optional|string $description = new Optional(),

        public Optional|array $defaultConfig = new Optional(),

        #[StringType, Max(128)]
        public Optional|string|null $icon = new Optional(),

        #[StringType, Max(2048)]
        public Optional|string|null $heroImageUrl = new Optional(),

        public Optional|int $priority = new Optional(),

        public Optional|bool $isVisible = new Optional(),
    ) {
    }
}
