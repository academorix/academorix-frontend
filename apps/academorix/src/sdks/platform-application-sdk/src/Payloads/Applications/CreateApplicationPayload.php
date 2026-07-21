<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Payloads\Applications;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/applications`
 * (platform-admin audience).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * ## Constraints
 *
 *   - `slug`             — 1..63 chars, matches `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`.
 *   - `name`             — 1..200 chars.
 *   - `defaultLocale`    — matches `^[a-z]{2,3}(-[A-Z]{2})?$` (BCP-47-lite subset the schema locks).
 *   - `defaultCurrency`  — three uppercase letters.
 *   - `centralHost` / `platformAdminHost` — RFC-1123 hostnames validated server-side.
 *   - `defaultBusinessType` — must be a `BusinessTypeKey` value (validated server-side against the live catalogue).
 *
 * ## Example
 *
 * ```php
 * $payload = new CreateApplicationPayload(
 *     slug: 'ticketing',
 *     name: 'Ticketing',
 *     centralHost: 'ticketing.stackra.app',
 *     platformAdminHost: 'admin.ticketing.stackra.app',
 * );
 * $wire = $payload->toArray();  // snake_case, ready to send.
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateApplicationPayload extends Data
{
    /**
     * @param  string                       $slug                  URL-safe application identifier. `1..63` chars; kebab-case DNS-safe segment.
     * @param  string                       $name                  Display name. `1..200` chars.
     * @param  string                       $centralHost           Marketing + tenant-picker host. RFC-1123 hostname; `≤200` chars.
     * @param  string                       $platformAdminHost     Stackra staff surface host. RFC-1123 hostname; `≤200` chars.
     * @param  string                       $defaultLocale         Default IETF locale tag. Defaults to `en`.
     * @param  string                       $defaultTimezone       Default IANA timezone name. Defaults to `UTC`.
     * @param  string                       $defaultCurrency       Default ISO-4217 currency code. Defaults to `USD`.
     * @param  string|null                  $description           Optional free-form description.
     * @param  string|null                  $defaultBusinessType   Optional pre-selected BusinessType key for the self-serve picker.
     * @param  array<string, mixed>|null    $config                Application-scoped config bag (branding tokens, feature-flag overrides, deployment metadata).
     * @param  bool|null                    $isDefault             When `true`, this becomes the fallback row for unmatched hosts. Server ensures at most one default per deployment.
     */
    public function __construct(
        #[StringType, Min(1), Max(63), Regex('/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/')]
        public string $slug,

        #[StringType, Min(1), Max(200)]
        public string $name,

        #[StringType, Max(200)]
        public string $centralHost,

        #[StringType, Max(200)]
        public string $platformAdminHost,

        #[StringType, Regex('/^[a-z]{2,3}(-[A-Z]{2})?$/')]
        public string $defaultLocale = 'en',

        #[StringType, Max(64)]
        public string $defaultTimezone = 'UTC',

        #[StringType, Regex('/^[A-Z]{3}$/')]
        public string $defaultCurrency = 'USD',

        #[StringType]
        public ?string $description = null,

        #[StringType, Max(32)]
        public ?string $defaultBusinessType = null,

        public ?array $config = null,

        public ?bool $isDefault = null,
    ) {
    }
}
