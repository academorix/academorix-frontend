<?php

declare(strict_types=1);

namespace Academorix\PlatformApplicationSdk\Payloads\Applications;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/applications/{id}`
 * (platform-admin audience).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * ## Slug immutability
 *
 * The Platform service refuses `slug` updates in-place — mutating
 * the routing key would strand every published URL. Update payloads
 * MAY carry a `slug` (the schema doesn't ban it), but callers should
 * NOT — the server responds `422 slug_immutable`. Keep the property
 * here so validators trip client-side too when a caller tries.
 *
 * ## Example
 *
 * ```php
 * // Change the name without touching anything else — the wire payload
 * // has exactly one key.
 * $patch = new UpdateApplicationPayload(name: 'Academorix (EU)');
 * $patch->toArray();  // ['name' => 'Academorix (EU)']
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateApplicationPayload extends Data
{
    /**
     * @param  Optional|string                       $slug                  Client-side signal; server rejects with `slug_immutable`. Present only to trip validators at the boundary.
     * @param  Optional|string                       $name                  Display name — 1..200 chars.
     * @param  Optional|string                       $centralHost           Marketing host — ≤200 chars.
     * @param  Optional|string                       $platformAdminHost     Admin host — ≤200 chars.
     * @param  Optional|string                       $defaultLocale         Default locale tag — matches `^[a-z]{2,3}(-[A-Z]{2})?$`.
     * @param  Optional|string                       $defaultTimezone       Default IANA timezone name — ≤64 chars.
     * @param  Optional|string                       $defaultCurrency       Default ISO-4217 currency — three uppercase letters.
     * @param  Optional|string|null                  $description           Free-form description. Pass `null` to clear.
     * @param  Optional|string|null                  $defaultBusinessType   BusinessType key. Pass `null` to clear.
     * @param  Optional|array<string, mixed>|null    $config                Config bag. Pass `null` to clear.
     * @param  Optional|bool                         $isDefault             Flip the fallback flag; the server ensures at most one default per deployment.
     */
    public function __construct(
        #[StringType, Min(1), Max(63), Regex('/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/')]
        public Optional|string $slug = new Optional(),

        #[StringType, Min(1), Max(200)]
        public Optional|string $name = new Optional(),

        #[StringType, Max(200)]
        public Optional|string $centralHost = new Optional(),

        #[StringType, Max(200)]
        public Optional|string $platformAdminHost = new Optional(),

        #[StringType, Regex('/^[a-z]{2,3}(-[A-Z]{2})?$/')]
        public Optional|string $defaultLocale = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $defaultTimezone = new Optional(),

        #[StringType, Regex('/^[A-Z]{3}$/')]
        public Optional|string $defaultCurrency = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        #[StringType, Max(32)]
        public Optional|string|null $defaultBusinessType = new Optional(),

        public Optional|array|null $config = new Optional(),

        public Optional|bool $isDefault = new Optional(),
    ) {
    }
}
