<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Payloads\BusinessTypes;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/business-types`
 * (platform-admin audience).
 *
 * Adds a new entry to the config-backed catalogue. The Platform
 * service seeds a matching row into `config/workspaces.php` +
 * `data/business-types.json` on save; a deploy is NOT required for
 * new keys to become bindable on Workspace rows.
 *
 * ## Constraints
 *
 *   - `key`         — 1..32 chars, `^[a-z][a-z0-9_]*$`. Immutable
 *     once created (see {@see UpdateBusinessTypePayload}).
 *   - `label`       — 1..255 chars.
 *   - `description` — 1..2000 chars.
 *   - `icon`        — Iconify token, ≤128 chars.
 *   - `defaultConfig` — free-form bag; server validates shape per
 *     `business-type.schema.json`'s `default_config`.
 *
 * ## Example
 *
 * ```php
 * $payload = new CreateBusinessTypePayload(
 *     key: 'university',
 *     label: 'University',
 *     description: 'University-level sports program.',
 *     defaultConfig: [
 *         'features' => ['athletes', 'teams'],
 *         'roles'    => ['coach', 'coordinator'],
 *     ],
 * );
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateBusinessTypePayload extends Data
{
    /**
     * @param  string                    $key            Enum key — also the value written to `workspaces.business_type`. Snake-case identifier.
     * @param  string                    $label          Active-locale human label.
     * @param  string                    $description    Active-locale description.
     * @param  array<string, mixed>      $defaultConfig  Bag applied at workspace provisioning time (features / terminology / roles / entitlements / onboarding steps / sports).
     * @param  string|null               $icon           Optional Iconify token used in admin surfaces.
     * @param  string|null               $heroImageUrl   Optional hero image URL shown on the self-serve `/sign-up` screen.
     * @param  int|null                  $priority       Sort order on the picker (ascending). Defaults to 100 server-side.
     * @param  bool|null                 $isVisible      Defaults to `true` server-side. When `false`, hidden from the self-serve picker.
     */
    public function __construct(
        #[StringType, Min(1), Max(32), Regex('/^[a-z][a-z0-9_]*$/')]
        public string $key,

        #[StringType, Min(1), Max(255)]
        public string $label,

        #[StringType, Min(1), Max(2000)]
        public string $description,

        public array $defaultConfig,

        #[StringType, Max(128)]
        public ?string $icon = null,

        #[StringType, Max(2048)]
        public ?string $heroImageUrl = null,

        public ?int $priority = null,

        public ?bool $isVisible = null,
    ) {
    }
}
